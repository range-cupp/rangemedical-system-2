// /pages/admin/pipeline.js
// Unified Protocol Pipeline - All protocol types in one view
// Range Medical - January 2026

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

export default function UnifiedPipeline() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  
  // Get filters from URL
  const activeTab = router.query.tab || 'active';
  const typeFilter = router.query.type || 'all';
  
  // Data states
  const [needsProtocol, setNeedsProtocol] = useState([]);
  const [activeProtocols, setActiveProtocols] = useState([]);
  const [completedProtocols, setCompletedProtocols] = useState([]);
  const [patients, setPatients] = useState([]);
  
  // UI states
  const [searchQuery, setSearchQuery] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [showQuickLogModal, setShowQuickLogModal] = useState(false);
  const [selectedProtocol, setSelectedProtocol] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editForm, setEditForm] = useState({});
  
  // Protocol creation states
  const [protocolCategory, setProtocolCategory] = useState('');
  const [protocolType, setProtocolType] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState('');
  const [medication, setMedication] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('');
  const [packageSize, setPackageSize] = useState('');
  const [startDate, setStartDate] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Protocol type configuration
  const PROTOCOL_TYPES = {
    weight_loss: { 
      label: 'Weight Loss', 
      icon: '💉', 
      color: '#8b5cf6',
      bgColor: '#f5f3ff',
      tracking: 'injections'
    },
    hrt: { 
      label: 'HRT', 
      icon: '💊', 
      color: '#3b82f6',
      bgColor: '#eff6ff',
      tracking: 'ongoing'
    },
    peptide: { 
      label: 'Peptide', 
      icon: '🧬', 
      color: '#10b981',
      bgColor: '#ecfdf5',
      tracking: 'days'
    },
    iv_therapy: { 
      label: 'IV Therapy', 
      icon: '💧', 
      color: '#06b6d4',
      bgColor: '#ecfeff',
      tracking: 'sessions'
    },
    hbot: { 
      label: 'HBOT', 
      icon: '🫁', 
      color: '#f59e0b',
      bgColor: '#fffbeb',
      tracking: 'sessions'
    },
    rlt: { 
      label: 'Red Light', 
      icon: '🔴', 
      color: '#ef4444',
      bgColor: '#fef2f2',
      tracking: 'sessions'
    },
    injection: { 
      label: 'Injection', 
      icon: '💉', 
      color: '#ec4899',
      bgColor: '#fdf2f8',
      tracking: 'sessions'
    }
  };

  const TYPE_FILTERS = [
    { id: 'all', label: 'All Types' },
    { id: 'weight_loss', label: '💉 Weight Loss' },
    { id: 'hrt', label: '💊 HRT' },
    { id: 'peptide', label: '🧬 Peptide' },
    { id: 'iv_therapy', label: '💧 IV' },
    { id: 'hbot', label: '🫁 HBOT' },
    { id: 'rlt', label: '🔴 Red Light' },
    { id: 'injection', label: '💉 Injection' }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/pipeline');
      const data = await res.json();
      
      if (res.ok) {
        setNeedsProtocol(data.needsProtocol || []);
        setActiveProtocols(data.activeProtocols || []);
        setCompletedProtocols(data.completedProtocols || []);
      }

      // Fetch patients
      const patientsRes = await fetch('/api/patients');
      const patientsData = await patientsRes.json();
      if (patientsRes.ok) {
        setPatients(patientsData.patients || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  // Filter protocols by type
  function filterByType(protocols) {
    if (typeFilter === 'all') return protocols;
    return protocols.filter(p => normalizeType(p.program_type) === typeFilter);
  }

  // Normalize program_type to our standard types
  function normalizeType(type) {
    if (!type) return 'peptide';
    const t = type.toLowerCase();
    if (t.includes('weight') || t.includes('semaglutide') || t.includes('tirzepatide') || t.includes('retatrutide')) return 'weight_loss';
    if (t.includes('hrt') || t.includes('testosterone')) return 'hrt';
    if (t.includes('iv') || t.includes('myers') || t.includes('nad')) return 'iv_therapy';
    if (t.includes('hbot') || t.includes('hyperbaric')) return 'hbot';
    if (t.includes('red_light') || t.includes('rlt')) return 'rlt';
    if (t.includes('injection') && !t.includes('weight')) return 'injection';
    return 'peptide';
  }

  // Filter by search
  function filterBySearch(items) {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(item => {
      const name = (item.patient_name || item.name || '').toLowerCase();
      const medication = (item.medication || item.primary_peptide || '').toLowerCase();
      return name.includes(q) || medication.includes(q);
    });
  }

  // Sort protocols by urgency
  function sortByUrgency(protocols) {
    return [...protocols].sort((a, b) => {
      // Priority: ending soon, then by days remaining, then by start date
      const aUrgency = getUrgencyScore(a);
      const bUrgency = getUrgencyScore(b);
      return bUrgency - aUrgency;
    });
  }

  function getUrgencyScore(protocol) {
    const type = normalizeType(protocol.program_type);
    const config = PROTOCOL_TYPES[type];
    
    if (config?.tracking === 'days') {
      const daysLeft = protocol.days_remaining || 0;
      if (daysLeft <= 0) return 100;
      if (daysLeft <= 3) return 80;
      if (daysLeft <= 7) return 60;
      return 40;
    }
    
    if (config?.tracking === 'sessions' || config?.tracking === 'injections') {
      const used = protocol.sessions_used || 0;
      const total = protocol.total_sessions || 1;
      const remaining = total - used;
      if (remaining <= 0) return 100;
      if (remaining <= 1) return 80;
      if (remaining <= 2) return 60;
      return 40;
    }
    
    if (config?.tracking === 'ongoing') {
      // HRT - check if refill or labs due
      if (protocol.needs_refill) return 80;
      if (protocol.labs_due) return 70;
      return 30;
    }
    
    return 50;
  }

  // Get display data for a protocol
  function getProtocolDisplay(protocol) {
    const type = normalizeType(protocol.program_type);
    const config = PROTOCOL_TYPES[type] || PROTOCOL_TYPES.peptide;
    
    let progress = '';
    let progressPercent = 0;
    let status = 'active';
    
    if (config.tracking === 'days') {
      // Calculate days from actual database fields
      let totalDays = protocol.duration_days || 30;
      let daysUsed = 0;
      let daysLeft = 0;
      
      // Try to get from days_remaining if available
      if (protocol.days_remaining !== undefined && protocol.days_remaining !== null) {
        daysLeft = protocol.days_remaining;
        daysUsed = totalDays - daysLeft;
      } else if (protocol.start_date) {
        // Calculate from start_date
        const startDate = new Date(protocol.start_date + 'T00:00:00');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const diffTime = today - startDate;
        daysUsed = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1; // Day 1 = start day
        daysLeft = totalDays - daysUsed;
      }
      
      // Clamp values
      daysUsed = Math.max(1, Math.min(daysUsed, totalDays));
      daysLeft = Math.max(0, daysLeft);
      
      progress = `Day ${daysUsed}/${totalDays}`;
      progressPercent = Math.min(100, (daysUsed / totalDays) * 100);
      if (daysLeft <= 0) status = 'ending';
      else if (daysLeft <= 3) status = 'urgent';
    } else if (config.tracking === 'sessions' || config.tracking === 'injections') {
      const used = protocol.sessions_used || 0;
      const total = protocol.total_sessions || protocol.total_injections || 4;
      progress = `${used}/${total} ${config.tracking}`;
      progressPercent = Math.min(100, (used / total) * 100);
      if (used >= total) status = 'complete';
      else if (total - used <= 1) status = 'urgent';
    } else if (config.tracking === 'ongoing') {
      progress = protocol.delivery_method === 'take_home' ? 'Take Home' : 'In Clinic';
      if (protocol.needs_refill) {
        status = 'urgent';
        progress = 'Refill Due';
      } else if (protocol.labs_due) {
        status = 'warning';
        progress = 'Labs Due';
      }
      progressPercent = 50;
    }
    
    return { ...config, progress, progressPercent, status, type };
  }

  // Navigate with URL params
  function setTab(tab) {
    router.push({
      pathname: '/admin/pipeline',
      query: { ...router.query, tab }
    }, undefined, { shallow: true });
  }

  function setType(type) {
    router.push({
      pathname: '/admin/pipeline',
      query: { ...router.query, type }
    }, undefined, { shallow: true });
  }

  // Open quick log modal
  function openQuickLog(protocol) {
    setSelectedProtocol(protocol);
    setShowQuickLogModal(true);
  }

  // Open edit modal
  function openEditModal(protocol) {
    setSelectedProtocol(protocol);
    const type = normalizeType(protocol.program_type);
    setEditForm({
      medication: protocol.medication || protocol.primary_peptide || '',
      selected_dose: protocol.selected_dose || '',
      frequency: protocol.frequency || 'Daily',
      delivery_method: protocol.delivery_method || '',
      start_date: protocol.start_date ? protocol.start_date.split('T')[0] : '',
      end_date: protocol.end_date ? protocol.end_date.split('T')[0] : '',
      total_sessions: protocol.total_sessions || protocol.total_injections || '',
      sessions_used: protocol.sessions_used || 0,
      status: protocol.status || 'active',
      notes: protocol.notes || ''
    });
    setShowEditModal(true);
  }

  // Submit edit
  async function submitEdit() {
    setSaving(true);
    try {
      const res = await fetch(`/api/protocols/${selectedProtocol.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });

      if (res.ok) {
        setShowEditModal(false);
        setSelectedProtocol(null);
        fetchData();
      } else {
        const error = await res.json();
        alert(error.message || 'Failed to update protocol');
      }
    } catch (error) {
      console.error('Edit error:', error);
      alert('Failed to update protocol');
    } finally {
      setSaving(false);
    }
  }

  // Open delete confirmation
  function openDeleteModal(protocol) {
    setSelectedProtocol(protocol);
    setShowDeleteModal(true);
  }

  // Confirm delete
  async function confirmDelete() {
    setSaving(true);
    try {
      const res = await fetch(`/api/protocols/${selectedProtocol.id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setShowDeleteModal(false);
        setSelectedProtocol(null);
        fetchData();
      } else {
        const error = await res.json();
        alert(error.message || 'Failed to delete protocol');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete protocol');
    } finally {
      setSaving(false);
    }
  }

  // Submit quick log
  async function submitQuickLog(logData) {
    try {
      const type = normalizeType(selectedProtocol.program_type);
      let endpoint = '/api/ghl/log-session';
      
      if (type === 'weight_loss') {
        endpoint = '/api/ghl/log-wl-injection';
      } else if (type === 'hrt') {
        if (logData.logType === 'injection') {
          endpoint = '/api/ghl/log-hrt-injection';
        } else if (logData.logType === 'pickup') {
          endpoint = '/api/ghl/log-hrt-fulfillment';
        } else if (logData.logType === 'blooddraw') {
          endpoint = '/api/ghl/log-hrt-blooddraw';
        }
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact_id: selectedProtocol.ghl_contact_id,
          contact_name: selectedProtocol.patient_name,
          protocol_id: selectedProtocol.id,
          ...logData
        })
      });

      if (res.ok) {
        setShowQuickLogModal(false);
        fetchData();
      }
    } catch (error) {
      console.error('Quick log error:', error);
    }
  }

  // Open assign modal
  function openAssignModal(purchase) {
    setSelectedPurchase(purchase);
    setProtocolCategory('');
    setProtocolType('');
    setDeliveryMethod('');
    setMedication('');
    setDosage('');
    setFrequency('Daily');
    setPackageSize('');
    setStartDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setShowAssignModal(true);
  }

  // Submit protocol assignment
  async function submitAssignment() {
    if (!protocolCategory || !protocolType) {
      alert('Please select protocol type');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/protocols/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purchase_id: selectedPurchase.id,
          patient_id: selectedPurchase.patient_id,
          patient_name: selectedPurchase.patient_name,
          ghl_contact_id: selectedPurchase.ghl_contact_id,
          program_type: protocolType,
          program_name: buildProgramName(),
          medication: medication,
          selected_dose: dosage,
          frequency: frequency,
          delivery_method: deliveryMethod,
          package_size: packageSize,
          start_date: startDate,
          notes: notes
        })
      });

      if (res.ok) {
        setShowAssignModal(false);
        fetchData();
      } else {
        const error = await res.json();
        alert(error.message || 'Failed to assign protocol');
      }
    } catch (error) {
      console.error('Assignment error:', error);
      alert('Failed to assign protocol');
    } finally {
      setSaving(false);
    }
  }

  function buildProgramName() {
    let name = '';
    switch (protocolCategory) {
      case 'weight_loss':
        name = `Weight Loss - ${medication || 'TBD'}`;
        break;
      case 'hrt':
        name = `HRT - ${medication || 'Testosterone Cypionate'}`;
        break;
      case 'peptide':
        name = `${protocolType} Program - ${medication || 'TBD'}`;
        break;
      case 'iv_therapy':
        name = `IV Therapy - ${packageSize || 'Single'}`;
        break;
      case 'hbot':
        name = `HBOT - ${packageSize || 'Single'}`;
        break;
      case 'rlt':
        name = `Red Light - ${packageSize || 'Single'}`;
        break;
      case 'injection':
        name = `Injection Pack - ${packageSize || 'Single'}`;
        break;
      default:
        name = 'Protocol';
    }
    return name;
  }

  // Get filtered and sorted data for current view
  const filteredActive = sortByUrgency(filterBySearch(filterByType(activeProtocols)));
  const filteredNeedsProtocol = filterBySearch(needsProtocol);
  const filteredCompleted = filterBySearch(filterByType(completedProtocols));
  const filteredPatients = filterBySearch(patients);

  // Count by type for badges
  const typeCounts = {};
  TYPE_FILTERS.forEach(t => {
    if (t.id === 'all') {
      typeCounts[t.id] = activeProtocols.length;
    } else {
      typeCounts[t.id] = activeProtocols.filter(p => normalizeType(p.program_type) === t.id).length;
    }
  });

  // Styles
  const styles = {
    container: {
      minHeight: '100vh',
      background: '#f8fafc',
      padding: '24px'
    },
    header: {
      maxWidth: '1400px',
      margin: '0 auto 24px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '16px'
    },
    title: {
      fontSize: '28px',
      fontWeight: '700',
      color: '#111'
    },
    searchBox: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      flex: '1',
      maxWidth: '400px'
    },
    searchInput: {
      flex: '1',
      padding: '10px 16px',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      fontSize: '14px'
    },
    mainTabs: {
      maxWidth: '1400px',
      margin: '0 auto 16px',
      display: 'flex',
      gap: '8px',
      borderBottom: '1px solid #e2e8f0',
      paddingBottom: '12px'
    },
    mainTab: (isActive) => ({
      padding: '10px 20px',
      border: 'none',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      background: isActive ? '#111' : 'transparent',
      color: isActive ? '#fff' : '#64748b',
      transition: 'all 0.15s'
    }),
    typeFilters: {
      maxWidth: '1400px',
      margin: '0 auto 20px',
      display: 'flex',
      gap: '8px',
      flexWrap: 'wrap'
    },
    typeFilter: (isActive) => ({
      padding: '6px 14px',
      border: '1px solid',
      borderColor: isActive ? '#111' : '#e2e8f0',
      borderRadius: '20px',
      fontSize: '13px',
      fontWeight: '500',
      cursor: 'pointer',
      background: isActive ? '#111' : '#fff',
      color: isActive ? '#fff' : '#64748b',
      transition: 'all 0.15s',
      display: 'flex',
      alignItems: 'center',
      gap: '6px'
    }),
    badge: {
      background: 'rgba(255,255,255,0.2)',
      padding: '2px 6px',
      borderRadius: '10px',
      fontSize: '11px'
    },
    content: {
      maxWidth: '1400px',
      margin: '0 auto'
    },
    grid: {
      display: 'grid',
      gap: '12px'
    },
    card: {
      background: '#fff',
      borderRadius: '12px',
      padding: '16px 20px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      display: 'grid',
      gridTemplateColumns: '60px 1fr auto',
      alignItems: 'center',
      gap: '16px',
      cursor: 'pointer',
      transition: 'all 0.15s',
      border: '1px solid #f1f5f9'
    },
    typeBadge: (config) => ({
      width: '48px',
      height: '48px',
      borderRadius: '12px',
      background: config?.bgColor || '#f3f4f6',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '22px'
    }),
    patientInfo: {
      minWidth: 0
    },
    patientName: {
      fontSize: '15px',
      fontWeight: '600',
      color: '#111',
      marginBottom: '4px'
    },
    protocolDetails: {
      fontSize: '13px',
      color: '#64748b',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      flexWrap: 'wrap'
    },
    detailChip: {
      background: '#f1f5f9',
      padding: '2px 8px',
      borderRadius: '4px',
      fontSize: '12px'
    },
    progressSection: {
      textAlign: 'right',
      minWidth: '140px'
    },
    progressText: {
      fontSize: '14px',
      fontWeight: '600',
      marginBottom: '6px'
    },
    progressBar: {
      height: '6px',
      background: '#e2e8f0',
      borderRadius: '3px',
      overflow: 'hidden',
      width: '120px',
      marginLeft: 'auto'
    },
    progressFill: (percent, status) => ({
      height: '100%',
      width: `${percent}%`,
      background: status === 'urgent' ? '#ef4444' : 
                  status === 'warning' ? '#f59e0b' :
                  status === 'complete' ? '#10b981' : '#3b82f6',
      borderRadius: '3px',
      transition: 'width 0.3s'
    }),
    actionButtons: {
      display: 'flex',
      gap: '8px',
      marginTop: '8px',
      justifyContent: 'flex-end'
    },
    actionBtn: {
      padding: '6px 12px',
      fontSize: '12px',
      fontWeight: '500',
      border: '1px solid #e2e8f0',
      borderRadius: '6px',
      background: '#fff',
      cursor: 'pointer',
      color: '#374151'
    },
    actionBtnPrimary: {
      padding: '6px 12px',
      fontSize: '12px',
      fontWeight: '500',
      border: 'none',
      borderRadius: '6px',
      background: '#111',
      color: '#fff',
      cursor: 'pointer'
    },
    emptyState: {
      textAlign: 'center',
      padding: '60px 20px',
      color: '#94a3b8'
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
      zIndex: 1000,
      padding: '20px'
    },
    modal: {
      background: '#fff',
      borderRadius: '16px',
      maxWidth: '500px',
      width: '100%',
      maxHeight: '90vh',
      overflow: 'auto'
    },
    modalHeader: {
      padding: '20px 24px',
      borderBottom: '1px solid #e2e8f0',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    modalTitle: {
      fontSize: '18px',
      fontWeight: '600'
    },
    modalClose: {
      background: 'none',
      border: 'none',
      fontSize: '24px',
      cursor: 'pointer',
      color: '#94a3b8'
    },
    modalBody: {
      padding: '24px'
    },
    modalFooter: {
      padding: '16px 24px',
      borderTop: '1px solid #e2e8f0',
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '12px'
    },
    formGroup: {
      marginBottom: '16px'
    },
    label: {
      display: 'block',
      fontSize: '13px',
      fontWeight: '500',
      color: '#374151',
      marginBottom: '6px'
    },
    input: {
      width: '100%',
      padding: '10px 12px',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      fontSize: '14px'
    },
    select: {
      width: '100%',
      padding: '10px 12px',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      fontSize: '14px',
      background: '#fff'
    },
    btn: {
      padding: '10px 20px',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      border: 'none'
    },
    btnPrimary: {
      background: '#111',
      color: '#fff'
    },
    btnSecondary: {
      background: '#f1f5f9',
      color: '#374151'
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={{ textAlign: 'center', padding: '100px 20px' }}>
          <div style={{ fontSize: '18px', color: '#64748b' }}>Loading pipeline...</div>
        </div>
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
          <h1 style={styles.title}>Protocol Pipeline</h1>
          <div style={styles.searchBox}>
            <input
              type="text"
              placeholder="Search patients or medications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.searchInput}
            />
          </div>
        </div>

        {/* Main Tabs */}
        <div style={styles.mainTabs}>
          <button
            style={styles.mainTab(activeTab === 'needs-protocol')}
            onClick={() => setTab('needs-protocol')}
          >
            Needs Protocol ({needsProtocol.length})
          </button>
          <button
            style={styles.mainTab(activeTab === 'active')}
            onClick={() => setTab('active')}
          >
            Active ({activeProtocols.length})
          </button>
          <button
            style={styles.mainTab(activeTab === 'completed')}
            onClick={() => setTab('completed')}
          >
            Completed ({completedProtocols.length})
          </button>
          <button
            style={styles.mainTab(activeTab === 'patients')}
            onClick={() => setTab('patients')}
          >
            Patients ({patients.length})
          </button>
        </div>

        {/* Type Filters (only show for Active/Completed tabs) */}
        {(activeTab === 'active' || activeTab === 'completed') && (
          <div style={styles.typeFilters}>
            {TYPE_FILTERS.map(filter => (
              <button
                key={filter.id}
                style={styles.typeFilter(typeFilter === filter.id)}
                onClick={() => setType(filter.id)}
              >
                {filter.label}
                <span style={styles.badge}>{typeCounts[filter.id] || 0}</span>
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        <div style={styles.content}>
          
          {/* Needs Protocol Tab */}
          {activeTab === 'needs-protocol' && (
            <div style={styles.grid}>
              {filteredNeedsProtocol.length === 0 ? (
                <div style={styles.emptyState}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>✓</div>
                  <div style={{ fontSize: '16px', fontWeight: '500' }}>All purchases have protocols assigned</div>
                </div>
              ) : (
                filteredNeedsProtocol.map(purchase => (
                  <div
                    key={purchase.id}
                    style={styles.card}
                  >
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: '#fef3c7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '22px'
                    }}>
                      📋
                    </div>
                    <div style={styles.patientInfo}>
                      <div style={styles.patientName}>{purchase.patient_name}</div>
                      <div style={styles.protocolDetails}>
                        <span style={styles.detailChip}>{purchase.item_name}</span>
                        <span>${purchase.amount}</span>
                        <span>•</span>
                        <span>{new Date(purchase.purchase_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div>
                      <button
                        style={styles.actionBtnPrimary}
                        onClick={(e) => {
                          e.stopPropagation();
                          openAssignModal(purchase);
                        }}
                      >
                        Assign Protocol
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Active Protocols Tab */}
          {activeTab === 'active' && (
            <div style={styles.grid}>
              {filteredActive.length === 0 ? (
                <div style={styles.emptyState}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
                  <div style={{ fontSize: '16px', fontWeight: '500' }}>
                    {typeFilter === 'all' ? 'No active protocols' : `No active ${PROTOCOL_TYPES[typeFilter]?.label || ''} protocols`}
                  </div>
                </div>
              ) : (
                filteredActive.map(protocol => {
                  const display = getProtocolDisplay(protocol);
                  return (
                    <div
                      key={protocol.id}
                      style={{
                        ...styles.card,
                        borderLeft: `4px solid ${display.color}`
                      }}
                      onClick={() => router.push(`/admin/protocol/${protocol.id}`)}
                    >
                      <div style={styles.typeBadge(display)}>
                        {display.icon}
                      </div>
                      <div style={styles.patientInfo}>
                        <div style={styles.patientName}>
                          {protocol.patient_name || 'Unknown Patient'}
                        </div>
                        <div style={styles.protocolDetails}>
                          <span style={{
                            ...styles.detailChip,
                            background: display.bgColor,
                            color: display.color
                          }}>
                            {display.label}
                          </span>
                          {/* Show duration for day-based protocols */}
                          {display.tracking === 'days' && protocol.duration_days && (
                            <span style={{
                              ...styles.detailChip,
                              background: '#fef3c7',
                              color: '#92400e'
                            }}>
                              {protocol.duration_days}-Day
                            </span>
                          )}
                          {protocol.medication && (
                            <span style={styles.detailChip}>{protocol.medication}</span>
                          )}
                          {protocol.selected_dose && (
                            <span>{protocol.selected_dose}</span>
                          )}
                          {protocol.delivery_method && (
                            <span style={styles.detailChip}>
                              {protocol.delivery_method === 'take_home' ? 'Take Home' : 
                               protocol.delivery_method === 'in_clinic' ? 'In Clinic' : 
                               protocol.delivery_method}
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={styles.progressSection}>
                        <div style={{
                          ...styles.progressText,
                          color: display.status === 'urgent' ? '#ef4444' : 
                                 display.status === 'warning' ? '#f59e0b' : '#111'
                        }}>
                          {display.progress}
                        </div>
                        <div style={styles.progressBar}>
                          <div style={styles.progressFill(display.progressPercent, display.status)} />
                        </div>
                        <div style={styles.actionButtons}>
                          <button
                            style={styles.actionBtn}
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/patients/${protocol.patient_id}`);
                            }}
                          >
                            Profile
                          </button>
                          <button
                            style={styles.actionBtn}
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal(protocol);
                            }}
                          >
                            Edit
                          </button>
                          <button
                            style={{...styles.actionBtn, color: '#ef4444', borderColor: '#fecaca'}}
                            onClick={(e) => {
                              e.stopPropagation();
                              openDeleteModal(protocol);
                            }}
                          >
                            Delete
                          </button>
                          <button
                            style={styles.actionBtnPrimary}
                            onClick={(e) => {
                              e.stopPropagation();
                              openQuickLog(protocol);
                            }}
                          >
                            Log
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Completed Tab */}
          {activeTab === 'completed' && (
            <div style={styles.grid}>
              {filteredCompleted.length === 0 ? (
                <div style={styles.emptyState}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
                  <div style={{ fontSize: '16px', fontWeight: '500' }}>No completed protocols</div>
                </div>
              ) : (
                filteredCompleted.map(protocol => {
                  const display = getProtocolDisplay(protocol);
                  return (
                    <div
                      key={protocol.id}
                      style={{
                        ...styles.card,
                        opacity: 0.8
                      }}
                      onClick={() => router.push(`/admin/protocol/${protocol.id}`)}
                    >
                      <div style={styles.typeBadge(display)}>
                        {display.icon}
                      </div>
                      <div style={styles.patientInfo}>
                        <div style={styles.patientName}>{protocol.patient_name}</div>
                        <div style={styles.protocolDetails}>
                          <span style={styles.detailChip}>{display.label}</span>
                          {protocol.medication && (
                            <span style={styles.detailChip}>{protocol.medication}</span>
                          )}
                          <span style={{ color: '#10b981' }}>✓ Completed</span>
                        </div>
                      </div>
                      <div style={styles.progressSection}>
                        <div style={{ color: '#64748b', fontSize: '13px', marginBottom: '8px' }}>
                          {protocol.end_date && new Date(protocol.end_date).toLocaleDateString()}
                        </div>
                        <div style={styles.actionButtons}>
                          <button
                            style={styles.actionBtn}
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal(protocol);
                            }}
                          >
                            Edit
                          </button>
                          <button
                            style={{...styles.actionBtn, color: '#ef4444', borderColor: '#fecaca'}}
                            onClick={(e) => {
                              e.stopPropagation();
                              openDeleteModal(protocol);
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Patients Tab */}
          {activeTab === 'patients' && (
            <div style={styles.grid}>
              {filteredPatients.length === 0 ? (
                <div style={styles.emptyState}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>👥</div>
                  <div style={{ fontSize: '16px', fontWeight: '500' }}>No patients found</div>
                </div>
              ) : (
                filteredPatients.slice(0, 100).map(patient => (
                  <div
                    key={patient.id}
                    style={styles.card}
                    onClick={() => router.push(`/patients/${patient.id}`)}
                  >
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: '#e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                      fontWeight: '600',
                      color: '#64748b'
                    }}>
                      {(patient.name || '?')[0].toUpperCase()}
                    </div>
                    <div style={styles.patientInfo}>
                      <div style={styles.patientName}>{patient.name}</div>
                      <div style={styles.protocolDetails}>
                        {patient.email && <span>{patient.email}</span>}
                        {patient.phone && <span>• {patient.phone}</span>}
                      </div>
                    </div>
                    <div>
                      <button style={styles.actionBtn}>View</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Assign Protocol Modal */}
      {showAssignModal && selectedPurchase && (
        <div style={styles.modalOverlay} onClick={() => setShowAssignModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Assign Protocol</h3>
              <button style={styles.modalClose} onClick={() => setShowAssignModal(false)}>×</button>
            </div>
            <div style={styles.modalBody}>
              <div style={{ 
                background: '#f8fafc', 
                padding: '12px', 
                borderRadius: '8px', 
                marginBottom: '20px' 
              }}>
                <div style={{ fontWeight: '600' }}>{selectedPurchase.patient_name}</div>
                <div style={{ fontSize: '13px', color: '#64748b' }}>
                  {selectedPurchase.item_name} • ${selectedPurchase.amount}
                </div>
              </div>

              {/* Step 1: Category */}
              <div style={styles.formGroup}>
                <label style={styles.label}>Protocol Category</label>
                <select
                  style={styles.select}
                  value={protocolCategory}
                  onChange={(e) => {
                    setProtocolCategory(e.target.value);
                    setProtocolType('');
                    setMedication('');
                    setDosage('');
                    setPackageSize('');
                  }}
                >
                  <option value="">Select category...</option>
                  <option value="weight_loss">💉 Weight Loss</option>
                  <option value="hrt">💊 HRT</option>
                  <option value="peptide">🧬 Peptide</option>
                  <option value="iv_therapy">💧 IV Therapy</option>
                  <option value="hbot">🫁 HBOT</option>
                  <option value="rlt">🔴 Red Light Therapy</option>
                  <option value="injection">💉 Injection Pack</option>
                </select>
              </div>

              {/* Step 2: Type-specific fields */}
              {protocolCategory === 'weight_loss' && (
                <>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Medication</label>
                    <select
                      style={styles.select}
                      value={medication}
                      onChange={(e) => {
                        setMedication(e.target.value);
                        setProtocolType('weight_loss');
                      }}
                    >
                      <option value="">Select medication...</option>
                      <option value="Semaglutide">Semaglutide</option>
                      <option value="Tirzepatide">Tirzepatide</option>
                      <option value="Retatrutide">Retatrutide</option>
                    </select>
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Starting Dose</label>
                    <select style={styles.select} value={dosage} onChange={(e) => setDosage(e.target.value)}>
                      <option value="">Select dose...</option>
                      <option value="0.25mg">0.25mg</option>
                      <option value="0.5mg">0.5mg</option>
                      <option value="1mg">1mg</option>
                      <option value="1.5mg">1.5mg</option>
                      <option value="2mg">2mg</option>
                      <option value="2.5mg">2.5mg</option>
                      <option value="5mg">5mg</option>
                      <option value="7.5mg">7.5mg</option>
                      <option value="10mg">10mg</option>
                      <option value="12.5mg">12.5mg</option>
                      <option value="15mg">15mg</option>
                    </select>
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Delivery Method</label>
                    <select style={styles.select} value={deliveryMethod} onChange={(e) => setDeliveryMethod(e.target.value)}>
                      <option value="">Select...</option>
                      <option value="in_clinic">In Clinic - Weekly Visits</option>
                      <option value="take_home">Take Home - Self Inject</option>
                    </select>
                  </div>
                </>
              )}

              {protocolCategory === 'hrt' && (
                <>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Medication</label>
                    <select
                      style={styles.select}
                      value={medication}
                      onChange={(e) => {
                        setMedication(e.target.value);
                        setProtocolType('hrt');
                      }}
                    >
                      <option value="">Select medication...</option>
                      <option value="Testosterone Cypionate">Testosterone Cypionate</option>
                      <option value="Testosterone Enanthate">Testosterone Enanthate</option>
                      <option value="Nandrolone">Nandrolone</option>
                      <option value="HCG">HCG</option>
                    </select>
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Dosage</label>
                    <input
                      type="text"
                      style={styles.input}
                      placeholder="e.g. 200mg/week"
                      value={dosage}
                      onChange={(e) => setDosage(e.target.value)}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Delivery Method</label>
                    <select style={styles.select} value={deliveryMethod} onChange={(e) => setDeliveryMethod(e.target.value)}>
                      <option value="">Select...</option>
                      <option value="in_clinic">In Clinic - 2x/week Injections</option>
                      <option value="take_home">Take Home - Self Inject</option>
                    </select>
                  </div>
                </>
              )}

              {protocolCategory === 'peptide' && (
                <>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Program Duration</label>
                    <select
                      style={styles.select}
                      value={protocolType}
                      onChange={(e) => setProtocolType(e.target.value)}
                    >
                      <option value="">Select duration...</option>
                      <option value="7 Day">7 Day</option>
                      <option value="10 Day">10 Day</option>
                      <option value="20 Day">20 Day</option>
                      <option value="30 Day">30 Day</option>
                      <option value="Vial">Vial</option>
                    </select>
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Peptide</label>
                    <select style={styles.select} value={medication} onChange={(e) => setMedication(e.target.value)}>
                      <option value="">Select peptide...</option>
                      <optgroup label="Recovery">
                        <option value="BPC-157">BPC-157</option>
                        <option value="TB-500">TB-500</option>
                        <option value="Wolverine Blend">Wolverine Blend (BPC/TB)</option>
                      </optgroup>
                      <optgroup label="Growth Hormone">
                        <option value="Ipamorelin">Ipamorelin</option>
                        <option value="CJC/Ipamorelin">CJC/Ipamorelin Blend</option>
                        <option value="Sermorelin">Sermorelin</option>
                        <option value="Tesamorelin">Tesamorelin</option>
                      </optgroup>
                      <optgroup label="Other">
                        <option value="AOD 9604">AOD 9604</option>
                        <option value="PT-141">PT-141</option>
                        <option value="Other">Other</option>
                      </optgroup>
                    </select>
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Dosage</label>
                    <input
                      type="text"
                      style={styles.input}
                      placeholder="e.g. 500mcg"
                      value={dosage}
                      onChange={(e) => setDosage(e.target.value)}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Delivery Method</label>
                    <select style={styles.select} value={deliveryMethod} onChange={(e) => setDeliveryMethod(e.target.value)}>
                      <option value="">Select...</option>
                      <option value="in_clinic">In Clinic</option>
                      <option value="take_home">Take Home</option>
                    </select>
                  </div>
                </>
              )}

              {(protocolCategory === 'iv_therapy' || protocolCategory === 'hbot' || protocolCategory === 'rlt' || protocolCategory === 'injection') && (
                <>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Package Size</label>
                    <select
                      style={styles.select}
                      value={packageSize}
                      onChange={(e) => {
                        setPackageSize(e.target.value);
                        setProtocolType(protocolCategory);
                      }}
                    >
                      <option value="">Select package...</option>
                      <option value="Single">Single Session</option>
                      <option value="5 Pack">5 Pack</option>
                      <option value="10 Pack">10 Pack</option>
                    </select>
                  </div>
                  {protocolCategory === 'injection' && (
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Delivery Method</label>
                      <select style={styles.select} value={deliveryMethod} onChange={(e) => setDeliveryMethod(e.target.value)}>
                        <option value="">Select...</option>
                        <option value="in_clinic">In Clinic</option>
                        <option value="take_home">Take Home</option>
                      </select>
                    </div>
                  )}
                </>
              )}

              {/* Common fields */}
              {protocolCategory && (
                <>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Start Date</label>
                    <input
                      type="date"
                      style={styles.input}
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Notes (optional)</label>
                    <textarea
                      style={{ ...styles.input, minHeight: '80px', resize: 'vertical' }}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Any additional notes..."
                    />
                  </div>
                </>
              )}
            </div>
            <div style={styles.modalFooter}>
              <button
                style={{ ...styles.btn, ...styles.btnSecondary }}
                onClick={() => setShowAssignModal(false)}
              >
                Cancel
              </button>
              <button
                style={{ ...styles.btn, ...styles.btnPrimary }}
                onClick={submitAssignment}
                disabled={saving || !protocolCategory || !protocolType}
              >
                {saving ? 'Saving...' : 'Assign Protocol'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Log Modal */}
      {showQuickLogModal && selectedProtocol && (
        <QuickLogModal
          protocol={selectedProtocol}
          protocolType={normalizeType(selectedProtocol.program_type)}
          onClose={() => setShowQuickLogModal(false)}
          onSubmit={submitQuickLog}
        />
      )}

      {/* Edit Protocol Modal */}
      {showEditModal && selectedProtocol && (
        <div style={styles.modalOverlay} onClick={() => setShowEditModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Edit Protocol</h3>
              <button style={styles.modalClose} onClick={() => setShowEditModal(false)}>×</button>
            </div>
            <div style={styles.modalBody}>
              <div style={{ 
                background: '#f8fafc', 
                padding: '12px', 
                borderRadius: '8px', 
                marginBottom: '20px' 
              }}>
                <div style={{ fontWeight: '600' }}>{selectedProtocol.patient_name}</div>
                <div style={{ fontSize: '13px', color: '#64748b' }}>
                  {selectedProtocol.program_name || normalizeType(selectedProtocol.program_type).toUpperCase()}
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Medication</label>
                <input
                  type="text"
                  style={styles.input}
                  value={editForm.medication}
                  onChange={(e) => setEditForm({...editForm, medication: e.target.value})}
                  placeholder="e.g. Semaglutide, BPC-157"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Dose</label>
                <input
                  type="text"
                  style={styles.input}
                  value={editForm.selected_dose}
                  onChange={(e) => setEditForm({...editForm, selected_dose: e.target.value})}
                  placeholder="e.g. 0.5mg, 500mcg"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Delivery Method</label>
                <select
                  style={styles.select}
                  value={editForm.delivery_method}
                  onChange={(e) => setEditForm({...editForm, delivery_method: e.target.value})}
                >
                  <option value="">Select...</option>
                  <option value="in_clinic">In Clinic</option>
                  <option value="take_home">Take Home</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Start Date</label>
                  <input
                    type="date"
                    style={styles.input}
                    value={editForm.start_date}
                    onChange={(e) => setEditForm({...editForm, start_date: e.target.value})}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>End Date</label>
                  <input
                    type="date"
                    style={styles.input}
                    value={editForm.end_date}
                    onChange={(e) => setEditForm({...editForm, end_date: e.target.value})}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Sessions/Injections Used</label>
                  <input
                    type="number"
                    style={styles.input}
                    value={editForm.sessions_used}
                    onChange={(e) => setEditForm({...editForm, sessions_used: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Total Sessions/Injections</label>
                  <input
                    type="number"
                    style={styles.input}
                    value={editForm.total_sessions}
                    onChange={(e) => setEditForm({...editForm, total_sessions: parseInt(e.target.value) || ''})}
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Status</label>
                <select
                  style={styles.select}
                  value={editForm.status}
                  onChange={(e) => setEditForm({...editForm, status: e.target.value})}
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
                  style={{ ...styles.input, minHeight: '80px', resize: 'vertical' }}
                  value={editForm.notes}
                  onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                  placeholder="Any notes..."
                />
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button
                style={{ ...styles.btn, ...styles.btnSecondary }}
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </button>
              <button
                style={{ ...styles.btn, ...styles.btnPrimary }}
                onClick={submitEdit}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedProtocol && (
        <div style={styles.modalOverlay} onClick={() => setShowDeleteModal(false)}>
          <div style={{...styles.modal, maxWidth: '400px'}} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Delete Protocol</h3>
              <button style={styles.modalClose} onClick={() => setShowDeleteModal(false)}>×</button>
            </div>
            <div style={styles.modalBody}>
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
                <p style={{ fontSize: '16px', marginBottom: '8px' }}>
                  Are you sure you want to delete this protocol?
                </p>
                <p style={{ 
                  background: '#f8fafc', 
                  padding: '12px', 
                  borderRadius: '8px',
                  marginTop: '16px'
                }}>
                  <strong>{selectedProtocol.patient_name}</strong><br />
                  <span style={{ color: '#64748b', fontSize: '14px' }}>
                    {selectedProtocol.program_name || selectedProtocol.medication}
                  </span>
                </p>
                <p style={{ color: '#ef4444', fontSize: '13px', marginTop: '16px' }}>
                  This action cannot be undone.
                </p>
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button
                style={{ ...styles.btn, ...styles.btnSecondary }}
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button
                style={{ 
                  ...styles.btn, 
                  background: '#ef4444',
                  color: '#fff'
                }}
                onClick={confirmDelete}
                disabled={saving}
              >
                {saving ? 'Deleting...' : 'Delete Protocol'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Quick Log Modal Component
function QuickLogModal({ protocol, protocolType, onClose, onSubmit }) {
  const [logType, setLogType] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [weight, setWeight] = useState('');
  const [dose, setDose] = useState(protocol.selected_dose || '');
  const [site, setSite] = useState('');
  const [supplyType, setSupplyType] = useState('');
  const [panelType, setPanelType] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Set default log type based on protocol type
  useEffect(() => {
    if (protocolType === 'weight_loss') setLogType('injection');
    else if (protocolType === 'hrt') setLogType('injection');
    else setLogType('session');
  }, [protocolType]);

  const handleSubmit = async () => {
    setSaving(true);
    await onSubmit({
      logType,
      date,
      weight: weight || null,
      dose: dose || null,
      site: site || null,
      supply_type: supplyType || null,
      panel_type: panelType || null,
      notes: notes || null,
      session_type: protocolType
    });
    setSaving(false);
  };

  const modalStyles = {
    overlay: {
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
      maxWidth: '450px',
      width: '100%',
      maxHeight: '90vh',
      overflow: 'auto',
      margin: '20px'
    },
    header: {
      padding: '20px 24px',
      borderBottom: '1px solid #e2e8f0'
    },
    body: {
      padding: '24px'
    },
    footer: {
      padding: '16px 24px',
      borderTop: '1px solid #e2e8f0',
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '12px'
    },
    formGroup: {
      marginBottom: '16px'
    },
    label: {
      display: 'block',
      fontSize: '13px',
      fontWeight: '500',
      marginBottom: '6px'
    },
    input: {
      width: '100%',
      padding: '10px 12px',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      fontSize: '14px'
    },
    select: {
      width: '100%',
      padding: '10px 12px',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      fontSize: '14px',
      background: '#fff'
    }
  };

  return (
    <div style={modalStyles.overlay} onClick={onClose}>
      <div style={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={modalStyles.header}>
          <h3 style={{ fontSize: '18px', fontWeight: '600' }}>
            Quick Log - {protocol.patient_name}
          </h3>
          <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
            {protocol.program_name || protocol.medication}
          </div>
        </div>
        <div style={modalStyles.body}>
          {/* HRT has multiple log types */}
          {protocolType === 'hrt' && (
            <div style={modalStyles.formGroup}>
              <label style={modalStyles.label}>Log Type</label>
              <select
                style={modalStyles.select}
                value={logType}
                onChange={(e) => setLogType(e.target.value)}
              >
                <option value="injection">💉 In-Clinic Injection</option>
                <option value="pickup">💊 Medication Pickup</option>
                <option value="blooddraw">🩸 Blood Draw</option>
              </select>
            </div>
          )}

          <div style={modalStyles.formGroup}>
            <label style={modalStyles.label}>Date</label>
            <input
              type="date"
              style={modalStyles.input}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {/* Weight Loss specific fields */}
          {protocolType === 'weight_loss' && (
            <>
              <div style={modalStyles.formGroup}>
                <label style={modalStyles.label}>Current Weight (lbs)</label>
                <input
                  type="number"
                  step="0.1"
                  style={modalStyles.input}
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="e.g. 215.5"
                />
              </div>
              <div style={modalStyles.formGroup}>
                <label style={modalStyles.label}>Dose</label>
                <select style={modalStyles.select} value={dose} onChange={(e) => setDose(e.target.value)}>
                  <option value="">Select dose...</option>
                  <option value="0.25mg">0.25mg</option>
                  <option value="0.5mg">0.5mg</option>
                  <option value="1mg">1mg</option>
                  <option value="1.5mg">1.5mg</option>
                  <option value="2mg">2mg</option>
                  <option value="2.5mg">2.5mg</option>
                  <option value="5mg">5mg</option>
                  <option value="7.5mg">7.5mg</option>
                  <option value="10mg">10mg</option>
                  <option value="12.5mg">12.5mg</option>
                  <option value="15mg">15mg</option>
                </select>
              </div>
            </>
          )}

          {/* HRT Injection fields */}
          {protocolType === 'hrt' && logType === 'injection' && (
            <>
              <div style={modalStyles.formGroup}>
                <label style={modalStyles.label}>Dose</label>
                <input
                  type="text"
                  style={modalStyles.input}
                  value={dose}
                  onChange={(e) => setDose(e.target.value)}
                  placeholder="e.g. 100mg"
                />
              </div>
              <div style={modalStyles.formGroup}>
                <label style={modalStyles.label}>Injection Site</label>
                <select style={modalStyles.select} value={site} onChange={(e) => setSite(e.target.value)}>
                  <option value="">Select site (optional)...</option>
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

          {/* HRT Pickup fields */}
          {protocolType === 'hrt' && logType === 'pickup' && (
            <div style={modalStyles.formGroup}>
              <label style={modalStyles.label}>Supply Type</label>
              <select style={modalStyles.select} value={supplyType} onChange={(e) => setSupplyType(e.target.value)}>
                <option value="">Select type...</option>
                <option value="prefilled_2week">Pre-filled 2 Week</option>
                <option value="prefilled_4week">Pre-filled 4 Week</option>
                <option value="vial_5ml">Vial 5ml</option>
                <option value="vial_10ml">Vial 10ml</option>
              </select>
            </div>
          )}

          {/* HRT Blood Draw fields */}
          {protocolType === 'hrt' && logType === 'blooddraw' && (
            <div style={modalStyles.formGroup}>
              <label style={modalStyles.label}>Panel Type</label>
              <select style={modalStyles.select} value={panelType} onChange={(e) => setPanelType(e.target.value)}>
                <option value="">Select panel...</option>
                <option value="Essential Panel">Essential Panel</option>
                <option value="Elite Panel">Elite Panel</option>
                <option value="Follow Up Panel">Follow Up Panel</option>
              </select>
            </div>
          )}

          {/* Notes for all */}
          <div style={modalStyles.formGroup}>
            <label style={modalStyles.label}>Notes (optional)</label>
            <textarea
              style={{ ...modalStyles.input, minHeight: '60px' }}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any observations..."
            />
          </div>
        </div>
        <div style={modalStyles.footer}>
          <button
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              background: '#f1f5f9',
              cursor: 'pointer'
            }}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              background: '#111',
              color: '#fff',
              cursor: 'pointer'
            }}
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Log'}
          </button>
        </div>
      </div>
    </div>
  );
}
