// /pages/admin/pipeline.js
// Pipeline with URL-based tabs for proper back button behavior
// Includes Patients tab
// Range Medical
// UPDATED: 2026-01-03 - Added Weight Loss injection logging

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

// Weight Loss medications and dosages
const WEIGHT_LOSS_MEDICATIONS = [
  'Semaglutide',
  'Tirzepatide',
  'Retatrutide'
];

const WEIGHT_LOSS_DOSAGES = {
  'Semaglutide': ['0.25mg', '0.5mg', '1mg', '1.7mg', '2.4mg'],
  'Tirzepatide': ['2.5mg', '5mg', '7.5mg', '10mg', '12.5mg', '15mg'],
  'Retatrutide': ['1mg', '2mg', '4mg', '8mg', '12mg']
};

const WEIGHT_LOSS_DURATIONS = [
  { value: '7', label: 'Weekly (7 days)' },
  { value: '14', label: 'Two Weeks (14 days)' },
  { value: '28', label: 'Month (28 days)' }
];

// Helper function to get today's date in Pacific time (YYYY-MM-DD format)
const getTodayPacific = () => {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
};

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
  const [showLogInjectionModal, setShowLogInjectionModal] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  
  const [templates, setTemplates] = useState([]);
  const [peptides, setPeptides] = useState([]);
  const [existingPacks, setExistingPacks] = useState([]);
  const [activeWLProtocols, setActiveWLProtocols] = useState([]);
  
  const [assignForm, setAssignForm] = useState({
    category: '',
    protocolType: '',
    deliveryMethod: '',
    templateId: '',
    peptideId: '',
    selectedDose: '',
    frequency: '',
    startDate: getTodayPacific(),
    notes: '',
    medication: '',
    medicationType: '',
    nadDose: '',
    wlMedication: '',
    wlDose: '',
    wlDuration: ''
  });
  
  const [completedForm, setCompletedForm] = useState({
    patientId: '',
    category: '',
    protocolType: '',
    deliveryMethod: '',
    templateId: '',
    peptideId: '',
    selectedDose: '',
    frequency: '',
    startDate: '',
    endDate: '',
    notes: '',
    medication: '',
    medicationType: '',
    nadDose: '',
    wlMedication: '',
    wlDose: '',
    wlDuration: ''
  });

  const [addToPackForm, setAddToPackForm] = useState({
    protocolId: '',
    sessionsToAdd: 1
  });

  const [logInjectionForm, setLogInjectionForm] = useState({
    protocolId: '',
    weight: '',
    injectionDate: getTodayPacific(),
    notes: ''
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

  // Auto-set templateId when category/protocolType/deliveryMethod change
  useEffect(() => {
    if (!assignForm.category || !assignForm.protocolType) return;
    
    const needsDelivery = hasDeliveryOptions(assignForm.category, assignForm.protocolType);
    
    if (needsDelivery && !assignForm.deliveryMethod) {
      return;
    }
    
    const template = findTemplate(
      assignForm.category, 
      assignForm.protocolType, 
      needsDelivery ? assignForm.deliveryMethod : null
    );
    
    if (template && template.id !== assignForm.templateId) {
      setAssignForm(prev => ({ ...prev, templateId: template.id }));
    }
  }, [assignForm.category, assignForm.protocolType, assignForm.deliveryMethod, templates]);

  // Auto-set templateId for completed form
  useEffect(() => {
    if (!completedForm.category || !completedForm.protocolType) return;
    
    const needsDelivery = hasDeliveryOptions(completedForm.category, completedForm.protocolType);
    
    if (needsDelivery && !completedForm.deliveryMethod) {
      return;
    }
    
    const template = findTemplate(
      completedForm.category, 
      completedForm.protocolType, 
      needsDelivery ? completedForm.deliveryMethod : null
    );
    
    if (template && template.id !== completedForm.templateId) {
      setCompletedForm(prev => ({ ...prev, templateId: template.id }));
    }
  }, [completedForm.category, completedForm.protocolType, completedForm.deliveryMethod, templates]);

  const fetchData = async () => {
    try {
      const pipelineRes = await fetch('/api/admin/pipeline');
      const pipelineData = await pipelineRes.json();
      
      setNeedsProtocol(pipelineData.needsProtocol || []);
      
      const sortedActive = (pipelineData.activeProtocols || []).sort((a, b) => {
        if (a.days_remaining === null || a.days_remaining === undefined) return 1;
        if (b.days_remaining === null || b.days_remaining === undefined) return -1;
        return a.days_remaining - b.days_remaining;
      });
      setActiveProtocols(sortedActive);
      
      setCompletedProtocols(pipelineData.completedProtocols || []);
      
      // Extract unique patients from pipeline data
      const patientMap = new Map();
      
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
      
      const extractedPatients = Array.from(patientMap.values())
        .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      
      setPatients(extractedPatients);
      
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
      const res = await fetch(`/api/protocols?patient_id=${patientId}&status=active&category=${encodeURIComponent(category || '')}`);
      if (!res.ok) {
        setExistingPacks([]);
        return;
      }
      const data = await res.json();
      setExistingPacks(Array.isArray(data) ? data.filter(p => p.total_sessions && p.sessions_used < p.total_sessions) : []);
    } catch (error) {
      console.error('Error fetching packs:', error);
      setExistingPacks([]);
    }
  };

  const fetchActiveWLProtocols = async (patientId, ghlContactId) => {
    try {
      const params = new URLSearchParams();
      if (patientId) params.append('patientId', patientId);
      if (ghlContactId) params.append('ghlContactId', ghlContactId);
      
      const res = await fetch(`/api/protocols/active-weight-loss?${params}`);
      if (res.ok) {
        const data = await res.json();
        setActiveWLProtocols(data.protocols || []);
        return data.protocols || [];
      }
    } catch (error) {
      console.error('Error fetching WL protocols:', error);
    }
    setActiveWLProtocols([]);
    return [];
  };

  // Detect if this is a weight loss injection purchase (not the initial program)
  const isWeightLossInjection = (purchase) => {
    const name = (purchase.product_name || purchase.item_name || '').toLowerCase();
    const category = (purchase.category || '').toLowerCase();
    
    // It's a WL injection if it's in Weight Loss category but is an "injection" not a "program"
    if (category === 'weight loss' || category === 'weight_loss') {
      // These are initial programs - NOT injections
      if (name.includes('program') || name.includes('monthly')) {
        return false;
      }
      // These ARE follow-up injections
      if (name.includes('injection') || name.includes('shot')) {
        return true;
      }
    }
    
    // Also check for generic "weight loss injection" in any category
    if (name.includes('weight loss injection') || name.includes('weight loss shot')) {
      return true;
    }
    
    return false;
  };

  const openAssignModal = async (purchase) => {
    setSelectedPurchase(purchase);
    setAssignForm({
      category: '',
      protocolType: '',
      deliveryMethod: '',
      templateId: '',
      peptideId: '',
      selectedDose: '',
      frequency: '',
      startDate: getTodayPacific(),
      notes: '',
      medication: ''
    });
    
    if (purchase.patient_id && isSingleSession(purchase.product_name)) {
      await fetchExistingPacks(purchase.patient_id, purchase.category);
    } else {
      setExistingPacks([]);
    }
    
    setShowAssignModal(true);
  };

  const openLogInjectionModal = async (purchase) => {
    setSelectedPurchase(purchase);
    setLogInjectionForm({
      protocolId: '',
      weight: '',
      injectionDate: getTodayPacific(),
      notes: ''
    });
    
    // Fetch active WL protocols for this patient
    const protocols = await fetchActiveWLProtocols(purchase.patient_id, purchase.ghl_contact_id);
    
    // Auto-select if only one protocol
    if (protocols.length === 1) {
      setLogInjectionForm(prev => ({ ...prev, protocolId: protocols[0].id }));
    }
    
    setShowLogInjectionModal(true);
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
    const isWL = assignForm.category?.toLowerCase() === 'weight_loss';
    
    if (!isWL && !assignForm.templateId) {
      alert('Please select a protocol type');
      return;
    }
    
    if (isWL && (!assignForm.deliveryMethod || !assignForm.wlDuration || !assignForm.wlMedication)) {
      alert('Please complete all weight loss fields');
      return;
    }
    
    try {
      let deliveryMethodDb = null;
      if (assignForm.deliveryMethod === 'In Clinic') {
        deliveryMethodDb = 'in_clinic';
      } else if (assignForm.deliveryMethod === 'Take Home') {
        deliveryMethodDb = 'take_home';
      }
      
      const payload = {
        patientId: selectedPurchase.patient_id,
        ghlContactId: selectedPurchase.ghl_contact_id,
        patientName: selectedPurchase.patient_name,
        purchaseId: selectedPurchase.id,
        templateId: isWL ? null : assignForm.templateId,
        peptideId: assignForm.peptideId,
        selectedDose: assignForm.selectedDose,
        frequency: assignForm.frequency,
        startDate: assignForm.startDate,
        notes: assignForm.notes,
        medication: assignForm.medication,
        deliveryMethod: deliveryMethodDb,
        isWeightLoss: isWL,
        wlDuration: isWL ? parseInt(assignForm.wlDuration) : null,
        // For in-clinic WL, set total_sessions to 4 (monthly = 4 weekly injections)
        totalSessions: isWL && deliveryMethodDb === 'in_clinic' ? 4 : null
      };
      
      const res = await fetch('/api/protocols/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await res.json();

      if (res.ok) {
        setShowAssignModal(false);
        fetchData();
      } else {
        alert('Error creating protocol: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error assigning protocol:', error);
      alert('Error creating protocol: ' + error.message);
    }
  };

  const handleLogInjection = async () => {
    if (!logInjectionForm.protocolId) {
      alert('Please select a protocol');
      return;
    }
    
    try {
      const res = await fetch('/api/protocols/log-injection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          protocolId: logInjectionForm.protocolId,
          purchaseId: selectedPurchase.id,
          patientId: selectedPurchase.patient_id,
          weight: logInjectionForm.weight ? parseFloat(logInjectionForm.weight) : null,
          injectionDate: logInjectionForm.injectionDate,
          notes: logInjectionForm.notes
        })
      });

      const result = await res.json();

      if (res.ok) {
        setShowLogInjectionModal(false);
        fetchData();
        alert(result.message || 'Injection logged successfully');
      } else {
        alert('Error logging injection: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error logging injection:', error);
      alert('Error logging injection: ' + error.message);
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
      let deliveryMethodDb = null;
      if (completedForm.deliveryMethod === 'In Clinic') {
        deliveryMethodDb = 'in_clinic';
      } else if (completedForm.deliveryMethod === 'Take Home') {
        deliveryMethodDb = 'take_home';
      }
      
      const isWL = completedForm.category?.toLowerCase() === 'weight_loss';
      
      const payload = {
        ...completedForm,
        deliveryMethod: deliveryMethodDb,
        isWeightLoss: isWL,
        wlDuration: isWL ? parseInt(completedForm.wlDuration) : null
      };
      
      const res = await fetch('/api/protocols/add-completed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setShowAddCompletedModal(false);
        setCompletedForm({
          patientId: '',
          category: '',
          protocolType: '',
          deliveryMethod: '',
          templateId: '',
          peptideId: '',
          selectedDose: '',
          frequency: '',
          startDate: '',
          endDate: '',
          notes: '',
          medication: '',
          medicationType: '',
          nadDose: '',
          wlMedication: '',
          wlDose: '',
          wlDuration: ''
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

  const handleDeleteProtocol = async (protocolId) => {
    if (!confirm('Delete this protocol? This will also unlink any associated purchases so they return to the pipeline.')) return;
    
    try {
      const res = await fetch(`/api/protocols/${protocolId}/delete`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
      } else {
        const error = await res.json();
        alert('Error deleting protocol: ' + (error.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error deleting protocol:', error);
      alert('Error deleting protocol');
    }
  };

  const getSelectedTemplate = (form) => {
    return templates.find(t => t.id === form.templateId);
  };

  const getSelectedPeptide = (form) => {
    return peptides.find(p => p.id === form.peptideId);
  };

  const isPeptideTemplate = (form) => {
    if (form.category?.toLowerCase() === 'peptide') {
      return !!form.deliveryMethod;
    }
    return false;
  };

  const isInjectionTemplate = (form) => {
    return form.category?.toLowerCase() === 'injection';
  };

  const isWeightLossTemplate = (form) => {
    if (form.category?.toLowerCase() === 'weight_loss') {
      return !!form.deliveryMethod;
    }
    return false;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('T')[0].split('-');
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      timeZone: 'America/Los_Angeles'
    });
  };

  const parseTemplateName = (name) => {
    const deliveryMatch = name.match(/\((In Clinic|Take Home)\)/i);
    const delivery = deliveryMatch ? deliveryMatch[1] : null;
    
    let type = name
      .replace(/^(Injection Therapy|Peptide Therapy|IV Therapy|HBOT|HRT|Red Light|Weight Loss)\s*-?\s*/i, '')
      .replace(/\s*\((In Clinic|Take Home)\)\s*/i, '')
      .trim();
    
    return { type, delivery };
  };

  const getProtocolTypes = (category) => {
    const categoryTemplates = templates.filter(t => t.category === category);
    const types = new Set();
    
    categoryTemplates.forEach(t => {
      const { type } = parseTemplateName(t.name);
      if (type) types.add(type);
    });
    
    return [...types].sort();
  };

  const hasDeliveryOptions = (category, protocolType) => {
    if (category?.toLowerCase() === 'peptide') {
      return true;
    }
    if (category?.toLowerCase() === 'weight_loss') {
      return true;
    }
    
    const categoryTemplates = templates.filter(t => t.category === category);
    const matchingTemplates = categoryTemplates.filter(t => {
      const { type } = parseTemplateName(t.name);
      return type === protocolType;
    });
    
    return matchingTemplates.some(t => {
      const { delivery } = parseTemplateName(t.name);
      return delivery !== null;
    });
  };

  const getDeliveryOptions = (category, protocolType) => {
    if (category?.toLowerCase() === 'peptide') {
      return ['In Clinic', 'Take Home'];
    }
    if (category?.toLowerCase() === 'weight_loss') {
      return ['In Clinic', 'Take Home'];
    }
    
    const categoryTemplates = templates.filter(t => t.category === category);
    const options = new Set();
    
    categoryTemplates.forEach(t => {
      const { type, delivery } = parseTemplateName(t.name);
      if (type === protocolType && delivery) {
        options.add(delivery);
      }
    });
    
    return [...options].sort();
  };

  const findTemplate = (category, protocolType, deliveryMethod) => {
    if (category?.toLowerCase() === 'peptide') {
      return templates.find(t => {
        if (t.category !== category) return false;
        const { type } = parseTemplateName(t.name);
        return type === protocolType;
      });
    }
    
    return templates.find(t => {
      if (t.category !== category) return false;
      const { type, delivery } = parseTemplateName(t.name);
      if (type !== protocolType) return false;
      if (deliveryMethod && delivery !== deliveryMethod) return false;
      if (!deliveryMethod && delivery) return false;
      return true;
    }) || templates.find(t => {
      if (t.category !== category) return false;
      const { type } = parseTemplateName(t.name);
      return type === protocolType;
    });
  };

  const isLabPurchase = (itemName) => {
    const name = itemName?.toLowerCase() || '';
    return name.includes('blood draw') || name.includes('lab') || name.includes('panel');
  };

  const filteredPatients = useMemo(() => {
    if (!patientSearch.trim()) return patients;
    const search = patientSearch.toLowerCase().trim();
    return patients.filter(p => {
      const name = (p.name || p.patient_name || `${p.first_name || ''} ${p.last_name || ''}`).toLowerCase();
      const email = (p.email || '').toLowerCase();
      const phone = (p.phone || '').toLowerCase();
      return name.includes(search) || email.includes(search) || phone.includes(search);
    });
  }, [patients, patientSearch]);

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
                      <div style={styles.itemName}>
                        {purchase.product_name}
                        {purchase.variant && <span style={styles.variant}> ({purchase.variant})</span>}
                      </div>
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
                      ) : isWeightLossInjection(purchase) ? (
                        // Weight Loss Injection - show Log Injection button
                        <button 
                          onClick={() => openLogInjectionModal(purchase)}
                          style={styles.logInjectionButton}
                        >
                          💉 Log Injection
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
          {activeTab === 'active' && (() => {
            const getUrgencyInfo = (protocol) => {
              const daysLeft = protocol.days_remaining;
              let color = '#22c55e';
              let needsAttention = false;
              let label = '';
              let progress = 0;
              
              const isTakeHome = protocol.delivery_method === 'take_home' || 
                (protocol.program_name || '').toLowerCase().includes('take home');
              
              const isInClinicSessions = protocol.total_sessions && !isTakeHome;
              
              if (isInClinicSessions) {
                const used = protocol.sessions_used || 0;
                const total = protocol.total_sessions;
                const left = total - used;
                progress = (used / total) * 100;
                
                if (left <= 0) {
                  color = '#dc2626';
                  needsAttention = true;
                  label = 'Complete';
                } else if (left === 1) {
                  color = '#dc2626';
                  needsAttention = true;
                  label = 'Last session';
                } else if (left <= 2) {
                  color = '#f59e0b';
                  needsAttention = true;
                  label = `${left} sessions left`;
                } else {
                  label = `${used}/${total} sessions`;
                }
              } else if (daysLeft !== null && daysLeft !== undefined) {
                if (daysLeft <= 0) {
                  color = '#dc2626';
                  needsAttention = true;
                  label = isTakeHome ? 'Refill due' : 'Ending today';
                } else if (daysLeft <= 3) {
                  color = '#dc2626';
                  needsAttention = true;
                  label = isTakeHome ? `Refill in ${daysLeft} day${daysLeft === 1 ? '' : 's'}` : `${daysLeft} day${daysLeft === 1 ? '' : 's'} left`;
                } else if (daysLeft <= 7) {
                  color = '#f59e0b';
                  needsAttention = true;
                  label = isTakeHome ? `Refill in ${daysLeft} days` : `${daysLeft} days left`;
                } else {
                  label = isTakeHome ? `Refill in ${daysLeft} days` : `${daysLeft} days left`;
                }
                
                if (protocol.start_date && protocol.end_date) {
                  const start = new Date(protocol.start_date);
                  const end = new Date(protocol.end_date);
                  const now = new Date();
                  const total = end - start;
                  const elapsed = now - start;
                  progress = Math.min(100, Math.max(0, (elapsed / total) * 100));
                }
              } else {
                label = 'Active';
              }
              
              return { color, needsAttention, label, progress };
            };
            
            const needsAttention = activeProtocols.filter(p => getUrgencyInfo(p).needsAttention);
            const onTrack = activeProtocols.filter(p => !getUrgencyInfo(p).needsAttention);
            
            const renderProtocolCard = (protocol) => {
              const urgency = getUrgencyInfo(protocol);
              
              return (
                <div 
                  key={protocol.id} 
                  style={{
                    ...styles.card,
                    borderLeft: `4px solid ${urgency.color}`,
                  }}
                >
                  <div style={styles.cardInfo}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
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
                    </div>
                    <div style={styles.itemName}>
                      {protocol.program_name}
                      {protocol.medication && ` - ${protocol.medication}`}
                      {protocol.selected_dose && ` (${protocol.selected_dose})`}
                    </div>
                    <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        flex: 1,
                        maxWidth: '200px',
                        height: '6px',
                        backgroundColor: '#e5e7eb',
                        borderRadius: '3px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${urgency.progress}%`,
                          height: '100%',
                          backgroundColor: urgency.color,
                          borderRadius: '3px',
                          transition: 'width 0.3s'
                        }} />
                      </div>
                      <span style={{ 
                        fontSize: '13px', 
                        color: urgency.color,
                        fontWeight: '500',
                        minWidth: '100px'
                      }}>
                        {urgency.label}
                      </span>
                    </div>
                  </div>
                  <div style={styles.cardActions}>
                    <Link 
                      href={`/admin/protocol/${protocol.id}`}
                      style={styles.viewButton}
                    >
                      View
                    </Link>
                    <button
                      onClick={() => handleDeleteProtocol(protocol.id)}
                      style={styles.deleteButton}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            };
            
            return (
              <div style={styles.list}>
                {activeProtocols.length === 0 ? (
                  <div style={styles.empty}>No active protocols</div>
                ) : (
                  <>
                    <div style={{
                      display: 'flex',
                      gap: '16px',
                      padding: '12px 16px',
                      backgroundColor: '#f9fafb',
                      borderRadius: '8px',
                      marginBottom: '16px',
                      fontSize: '14px'
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#dc2626' }} />
                        <strong>{needsAttention.length}</strong> needs attention
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e' }} />
                        <strong>{onTrack.length}</strong> on track
                      </span>
                    </div>
                    
                    {needsAttention.length > 0 && (
                      <>
                        <div style={{
                          fontSize: '12px',
                          fontWeight: '600',
                          color: '#dc2626',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          marginBottom: '12px',
                          marginTop: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <span>⚠️ Needs Attention</span>
                          <span style={{
                            backgroundColor: '#fef2f2',
                            padding: '2px 8px',
                            borderRadius: '10px',
                            fontSize: '11px'
                          }}>
                            {needsAttention.length}
                          </span>
                        </div>
                        {needsAttention.map(renderProtocolCard)}
                      </>
                    )}
                    
                    {onTrack.length > 0 && (
                      <>
                        <div style={{
                          fontSize: '12px',
                          fontWeight: '600',
                          color: '#22c55e',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          marginBottom: '12px',
                          marginTop: needsAttention.length > 0 ? '24px' : '8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <span>✓ On Track</span>
                          <span style={{
                            backgroundColor: '#f0fdf4',
                            padding: '2px 8px',
                            borderRadius: '10px',
                            fontSize: '11px'
                          }}>
                            {onTrack.length}
                          </span>
                        </div>
                        {onTrack.map(renderProtocolCard)}
                      </>
                    )}
                  </>
                )}
              </div>
            );
          })()}

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
                      <button
                        onClick={() => handleDeleteProtocol(protocol.id)}
                        style={styles.deleteButton}
                      >
                        Delete
                      </button>
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
                          {patient.protocol_count > 0 && <span> • {patient.protocol_count} {patient.protocol_count === 1 ? 'protocol' : 'protocols'}</span>}
                          {patient.purchase_count > 0 && <span> • {patient.purchase_count} {patient.purchase_count === 1 ? 'purchase' : 'purchases'}</span>}
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

        {/* Log Injection Modal */}
        {showLogInjectionModal && selectedPurchase && (
          <div style={styles.modalOverlay}>
            <div style={styles.modal}>
              <h2 style={styles.modalTitle}>💉 Log Weight Loss Injection</h2>
              <p style={styles.modalSubtitle}>
                {selectedPurchase.patient_name} • {selectedPurchase.product_name}
              </p>

              {activeWLProtocols.length === 0 ? (
                <div style={styles.noProtocolWarning}>
                  <p>⚠️ No active Weight Loss protocol found for this patient.</p>
                  <p style={{ fontSize: '13px', marginTop: '8px' }}>
                    Create a Weight Loss protocol first, then come back to log injections.
                  </p>
                </div>
              ) : (
                <>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Protocol</label>
                    <select
                      style={styles.select}
                      value={logInjectionForm.protocolId}
                      onChange={(e) => setLogInjectionForm({ ...logInjectionForm, protocolId: e.target.value })}
                    >
                      <option value="">Select protocol...</option>
                      {activeWLProtocols.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.program_name} - {p.medication || 'Weight Loss'} ({p.sessions_used || 0}/{p.total_sessions || '?'} sessions)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Patient Weight (lbs)</label>
                    <input
                      type="number"
                      style={styles.input}
                      placeholder="e.g., 185"
                      value={logInjectionForm.weight}
                      onChange={(e) => setLogInjectionForm({ ...logInjectionForm, weight: e.target.value })}
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Injection Date</label>
                    <input
                      type="date"
                      style={styles.input}
                      value={logInjectionForm.injectionDate}
                      onChange={(e) => setLogInjectionForm({ ...logInjectionForm, injectionDate: e.target.value })}
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Notes (optional)</label>
                    <textarea
                      style={styles.textarea}
                      value={logInjectionForm.notes}
                      onChange={(e) => setLogInjectionForm({ ...logInjectionForm, notes: e.target.value })}
                      placeholder="Any observations, side effects, etc..."
                    />
                  </div>
                </>
              )}

              <div style={styles.modalActions}>
                <button 
                  onClick={() => setShowLogInjectionModal(false)}
                  style={styles.cancelButton}
                >
                  Cancel
                </button>
                {activeWLProtocols.length > 0 && (
                  <button 
                    onClick={handleLogInjection}
                    style={styles.logInjectionSubmitButton}
                    disabled={!logInjectionForm.protocolId}
                  >
                    Log Injection
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Assign Protocol Modal */}
        {showAssignModal && selectedPurchase && (
          <div style={styles.modalOverlay}>
            <div style={styles.modal}>
              <h2 style={styles.modalTitle}>Start Protocol</h2>
              <p style={styles.modalSubtitle}>
                {selectedPurchase.patient_name || 'Unknown'} - {selectedPurchase.product_name}
              </p>

              <div style={styles.formGroup}>
                <label style={styles.label}>Category</label>
                <select
                  style={styles.select}
                  value={assignForm.category}
                  onChange={(e) => setAssignForm({ ...assignForm, category: e.target.value, protocolType: '', deliveryMethod: '', templateId: '', peptideId: '', selectedDose: '', medication: '', medicationType: '', nadDose: '', wlMedication: '', wlDose: '', wlDuration: '' })}
                >
                  <option value="">Select category...</option>
                  {[...new Set(templates.map(t => t.category))].filter(c => c).sort().map(cat => {
                    let displayName = cat.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                    if (cat === 'iv_therapy') displayName = 'IV Therapy';
                    if (cat === 'hrt') displayName = 'HRT';
                    if (cat === 'hbot') displayName = 'HBOT';
                    return (
                      <option key={cat} value={cat}>{displayName}</option>
                    );
                  })}
                </select>
              </div>

              {assignForm.category && assignForm.category.toLowerCase() !== 'weight_loss' && (
                <div style={styles.formGroup}>
                  <label style={styles.label}>Protocol</label>
                  <select
                    style={styles.select}
                    value={assignForm.protocolType}
                    onChange={(e) => setAssignForm({ ...assignForm, protocolType: e.target.value, deliveryMethod: '', templateId: '' })}
                  >
                    <option value="">Select protocol...</option>
                    {getProtocolTypes(assignForm.category).map(pt => (
                      <option key={pt} value={pt}>{pt}</option>
                    ))}
                  </select>
                </div>
              )}

              {assignForm.category?.toLowerCase() === 'weight_loss' && (
                <div style={styles.formGroup}>
                  <label style={styles.label}>Delivery Method</label>
                  <select
                    style={{...styles.select, borderColor: !assignForm.deliveryMethod ? '#f87171' : '#e5e7eb'}}
                    value={assignForm.deliveryMethod}
                    onChange={(e) => setAssignForm({ ...assignForm, deliveryMethod: e.target.value })}
                  >
                    <option value="">Select delivery...</option>
                    <option value="In Clinic">In Clinic</option>
                    <option value="Take Home">Take Home</option>
                  </select>
                </div>
              )}

              {assignForm.category?.toLowerCase() === 'weight_loss' && assignForm.deliveryMethod && (
                <div style={styles.formGroup}>
                  <label style={styles.label}>Duration</label>
                  <select
                    style={styles.select}
                    value={assignForm.wlDuration}
                    onChange={(e) => setAssignForm({ ...assignForm, wlDuration: e.target.value })}
                  >
                    <option value="">Select duration...</option>
                    {WEIGHT_LOSS_DURATIONS.map(d => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {assignForm.category?.toLowerCase() === 'weight_loss' && assignForm.wlDuration && (
                <>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Medication</label>
                    <select
                      style={styles.select}
                      value={assignForm.wlMedication || ''}
                      onChange={(e) => {
                        const med = e.target.value;
                        setAssignForm({ 
                          ...assignForm, 
                          wlMedication: med, 
                          wlDose: '',
                          medication: med 
                        });
                      }}
                    >
                      <option value="">Select medication...</option>
                      {WEIGHT_LOSS_MEDICATIONS.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  
                  {assignForm.wlMedication && (
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Dosage</label>
                      <select
                        style={styles.select}
                        value={assignForm.wlDose || ''}
                        onChange={(e) => {
                          const dose = e.target.value;
                          setAssignForm({ 
                            ...assignForm, 
                            wlDose: dose,
                            medication: `${assignForm.wlMedication} ${dose}`,
                            selectedDose: dose
                          });
                        }}
                      >
                        <option value="">Select dosage...</option>
                        {(WEIGHT_LOSS_DOSAGES[assignForm.wlMedication] || []).map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </>
              )}

              {assignForm.protocolType && assignForm.category?.toLowerCase() !== 'weight_loss' && (assignForm.category?.toLowerCase() === 'peptide' || hasDeliveryOptions(assignForm.category, assignForm.protocolType)) && (
                <div style={styles.formGroup}>
                  <label style={styles.label}>Delivery Method</label>
                  <select
                    style={{...styles.select, borderColor: !assignForm.deliveryMethod ? '#f87171' : '#e5e7eb'}}
                    value={assignForm.deliveryMethod}
                    onChange={(e) => {
                      const method = e.target.value;
                      const template = findTemplate(assignForm.category, assignForm.protocolType, method);
                      setAssignForm({ ...assignForm, deliveryMethod: method, templateId: template?.id || '' });
                    }}
                  >
                    <option value="">Select delivery...</option>
                    {(assignForm.category?.toLowerCase() === 'peptide' ? ['In Clinic', 'Take Home'] : getDeliveryOptions(assignForm.category, assignForm.protocolType)).map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              )}

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
                <>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Medication</label>
                    <select
                      style={styles.select}
                      value={assignForm.medicationType || ''}
                      onChange={(e) => {
                        const medType = e.target.value;
                        if (medType === 'NAD+') {
                          setAssignForm({ ...assignForm, medicationType: medType, medication: '', nadDose: '' });
                        } else {
                          setAssignForm({ ...assignForm, medicationType: medType, medication: medType, nadDose: '' });
                        }
                      }}
                    >
                      <option value="">Select medication...</option>
                      <option value="NAD+">NAD+</option>
                      <option value="B12">B12</option>
                      <option value="Glutathione">Glutathione</option>
                      <option value="Vitamin D">Vitamin D</option>
                      <option value="Biotin">Biotin</option>
                      <option value="Lipo-C">Lipo-C</option>
                      <option value="Skinny Shot">Skinny Shot</option>
                      <option value="Toradol">Toradol</option>
                    </select>
                  </div>
                  
                  {assignForm.medicationType === 'NAD+' && (
                    <div style={styles.formGroup}>
                      <label style={styles.label}>NAD+ Dosage (mg)</label>
                      <input
                        type="text"
                        style={styles.input}
                        placeholder="e.g., 50, 100, 200"
                        value={assignForm.nadDose || ''}
                        onChange={(e) => {
                          const dose = e.target.value;
                          setAssignForm({ 
                            ...assignForm, 
                            nadDose: dose,
                            medication: dose ? `NAD+ ${dose}mg` : 'NAD+'
                          });
                        }}
                      />
                    </div>
                  )}
                </>
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
                  <option value="5x/week">5x/Week</option>
                  <option value="4x/week">4x/Week</option>
                  <option value="3x/week">3x/Week</option>
                  <option value="every other day">Every Other Day</option>
                  <option value="2x/week">2x/Week</option>
                  <option value="weekly">Weekly</option>
                  <option value="every 5 days">Every 5 Days</option>
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
                  disabled={
                    assignForm.category?.toLowerCase() === 'weight_loss'
                      ? !assignForm.deliveryMethod || !assignForm.wlDuration || !assignForm.wlMedication
                      : !assignForm.templateId
                  }
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
                <label style={styles.label}>Category</label>
                <select
                  style={styles.select}
                  value={completedForm.category}
                  onChange={(e) => setCompletedForm({ ...completedForm, category: e.target.value, protocolType: '', deliveryMethod: '', templateId: '', peptideId: '', selectedDose: '', medication: '', medicationType: '', nadDose: '', wlMedication: '', wlDose: '', wlDuration: '' })}
                >
                  <option value="">Select category...</option>
                  {[...new Set(templates.map(t => t.category))].filter(c => c).sort().map(cat => {
                    let displayName = cat.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                    if (cat === 'iv_therapy') displayName = 'IV Therapy';
                    if (cat === 'hrt') displayName = 'HRT';
                    if (cat === 'hbot') displayName = 'HBOT';
                    return (
                      <option key={cat} value={cat}>{displayName}</option>
                    );
                  })}
                </select>
              </div>

              {completedForm.category && completedForm.category.toLowerCase() !== 'weight_loss' && (
                <div style={styles.formGroup}>
                  <label style={styles.label}>Protocol</label>
                  <select
                    style={styles.select}
                    value={completedForm.protocolType}
                    onChange={(e) => setCompletedForm({ ...completedForm, protocolType: e.target.value, deliveryMethod: '', templateId: '' })}
                  >
                    <option value="">Select protocol...</option>
                    {getProtocolTypes(completedForm.category).map(pt => (
                      <option key={pt} value={pt}>{pt}</option>
                    ))}
                  </select>
                </div>
              )}

              {completedForm.category?.toLowerCase() === 'weight_loss' && (
                <div style={styles.formGroup}>
                  <label style={styles.label}>Delivery Method</label>
                  <select
                    style={{...styles.select, borderColor: !completedForm.deliveryMethod ? '#f87171' : '#e5e7eb'}}
                    value={completedForm.deliveryMethod}
                    onChange={(e) => setCompletedForm({ ...completedForm, deliveryMethod: e.target.value })}
                  >
                    <option value="">Select delivery...</option>
                    <option value="In Clinic">In Clinic</option>
                    <option value="Take Home">Take Home</option>
                  </select>
                </div>
              )}

              {completedForm.category?.toLowerCase() === 'weight_loss' && completedForm.deliveryMethod && (
                <div style={styles.formGroup}>
                  <label style={styles.label}>Duration</label>
                  <select
                    style={styles.select}
                    value={completedForm.wlDuration || ''}
                    onChange={(e) => setCompletedForm({ ...completedForm, wlDuration: e.target.value })}
                  >
                    <option value="">Select duration...</option>
                    {WEIGHT_LOSS_DURATIONS.map(d => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {completedForm.category?.toLowerCase() === 'weight_loss' && completedForm.wlDuration && (
                <>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Medication</label>
                    <select
                      style={styles.select}
                      value={completedForm.wlMedication || ''}
                      onChange={(e) => {
                        const med = e.target.value;
                        setCompletedForm({ 
                          ...completedForm, 
                          wlMedication: med, 
                          wlDose: '',
                          medication: med 
                        });
                      }}
                    >
                      <option value="">Select medication...</option>
                      {WEIGHT_LOSS_MEDICATIONS.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  
                  {completedForm.wlMedication && (
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Dosage</label>
                      <select
                        style={styles.select}
                        value={completedForm.wlDose || ''}
                        onChange={(e) => {
                          const dose = e.target.value;
                          setCompletedForm({ 
                            ...completedForm, 
                            wlDose: dose,
                            medication: `${completedForm.wlMedication} ${dose}`,
                            selectedDose: dose
                          });
                        }}
                      >
                        <option value="">Select dosage...</option>
                        {(WEIGHT_LOSS_DOSAGES[completedForm.wlMedication] || []).map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </>
              )}

              {completedForm.protocolType && completedForm.category?.toLowerCase() !== 'weight_loss' && (completedForm.category?.toLowerCase() === 'peptide' || hasDeliveryOptions(completedForm.category, completedForm.protocolType)) && (
                <div style={styles.formGroup}>
                  <label style={styles.label}>Delivery Method</label>
                  <select
                    style={{...styles.select, borderColor: !completedForm.deliveryMethod ? '#f87171' : '#e5e7eb'}}
                    value={completedForm.deliveryMethod}
                    onChange={(e) => {
                      const method = e.target.value;
                      const template = findTemplate(completedForm.category, completedForm.protocolType, method);
                      setCompletedForm({ ...completedForm, deliveryMethod: method, templateId: template?.id || '' });
                    }}
                  >
                    <option value="">Select delivery...</option>
                    {(completedForm.category?.toLowerCase() === 'peptide' ? ['In Clinic', 'Take Home'] : getDeliveryOptions(completedForm.category, completedForm.protocolType)).map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              )}

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
                  <option value="5x/week">5x/Week</option>
                  <option value="4x/week">4x/Week</option>
                  <option value="3x/week">3x/Week</option>
                  <option value="every other day">Every Other Day</option>
                  <option value="2x/week">2x/Week</option>
                  <option value="weekly">Weekly</option>
                  <option value="every 5 days">Every 5 Days</option>
                  <option value="as needed">As Needed</option>
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
                  disabled={
                    !completedForm.patientId || (
                      completedForm.category?.toLowerCase() === 'weight_loss'
                        ? !completedForm.deliveryMethod || !completedForm.wlDuration || !completedForm.wlMedication
                        : !completedForm.templateId
                    )
                  }
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

export async function getServerSideProps() {
  return { props: {} };
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
  variant: {
    fontWeight: '500',
    color: '#059669',
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
  logInjectionButton: {
    padding: '8px 16px',
    backgroundColor: '#8b5cf6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
  logInjectionSubmitButton: {
    flex: 1,
    padding: '12px',
    backgroundColor: '#8b5cf6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
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
  deleteButton: {
    padding: '8px 16px',
    backgroundColor: 'white',
    color: '#dc2626',
    border: '1px solid #fecaca',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
  empty: {
    textAlign: 'center',
    padding: '40px',
    color: '#6b7280',
    backgroundColor: '#f9fafb',
    borderRadius: '12px',
  },
  noProtocolWarning: {
    backgroundColor: '#fef3c7',
    border: '1px solid #fcd34d',
    borderRadius: '8px',
    padding: '16px',
    color: '#92400e',
    marginBottom: '16px',
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
