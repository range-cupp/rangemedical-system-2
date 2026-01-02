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

  // Cascading dropdown state
  const [templateCategory, setTemplateCategory] = useState('');
  const [templateLocation, setTemplateLocation] = useState('');
  const [templatePackSize, setTemplatePackSize] = useState('');
  
  // HRT specific state
  const [hrtGender, setHrtGender] = useState('');
  const [hrtSupplyType, setHrtSupplyType] = useState('');
  const [hrtMedication, setHrtMedication] = useState('');
  const [hrtDose, setHrtDose] = useState('');
  
  // Weight Loss specific state
  const [wlMedication, setWlMedication] = useState('');
  const [wlDose, setWlDose] = useState('');
  
  // Session-based therapy state (Red Light, HBOT)
  const [sessionPackSize, setSessionPackSize] = useState('');

  // Template categories configuration
  const TEMPLATE_CATEGORIES = [
    { id: 'injection', name: 'Injection Therapy', hasLocation: true, hasPackSize: true },
    { id: 'peptide-7', name: 'Peptide Therapy - 7 Day', hasLocation: false, hasPackSize: false },
    { id: 'peptide-10', name: 'Peptide Therapy - 10 Day', hasLocation: false, hasPackSize: false },
    { id: 'peptide-14', name: 'Peptide Therapy - 14 Day', hasLocation: false, hasPackSize: false },
    { id: 'peptide-20', name: 'Peptide Therapy - 20 Day', hasLocation: false, hasPackSize: false },
    { id: 'peptide-30', name: 'Peptide Therapy - 30 Day', hasLocation: false, hasPackSize: false },
    { id: 'peptide-vial', name: 'Peptide Vial', hasLocation: false, hasPackSize: false },
    { id: 'iv', name: 'IV Therapy', hasLocation: false, hasPackSize: false },
    { id: 'hrt', name: 'HRT Protocol', hasLocation: false, hasPackSize: false },
    { id: 'weight-loss', name: 'Weight Loss Program', hasLocation: false, hasPackSize: false },
    { id: 'red-light', name: 'Red Light Therapy', hasLocation: false, hasPackSize: false },
    { id: 'hbot', name: 'Hyperbaric Oxygen Therapy', hasLocation: false, hasPackSize: false },
    { id: 'other', name: 'Other', hasLocation: false, hasPackSize: false }
  ];

  const TEMPLATE_LOCATIONS = [
    { id: 'in-clinic', name: 'In Clinic' },
    { id: 'take-home', name: 'Take Home' }
  ];

  const TEMPLATE_PACK_SIZES = [
    { id: 'single', name: 'Single' },
    { id: 'double', name: 'Double' },
    { id: '4-pack', name: '4 Pack (Month Supply)' },
    { id: '10-pack', name: '10 Pack' },
    { id: '12-pack', name: '12 Pack' }
  ];

  // HRT Options
  const HRT_GENDERS = [
    { id: 'male', name: 'Male' },
    { id: 'female', name: 'Female' }
  ];

  const HRT_SUPPLY_TYPES = [
    { id: 'vial', name: 'Vial (10-12 weeks)' },
    { id: 'prefilled', name: 'Prefilled Syringes (Monthly)' }
  ];

  const HRT_MEDICATIONS = {
    male: [
      { id: 'testosterone-cypionate', name: 'Testosterone Cypionate' },
      { id: 'testosterone-enanthate', name: 'Testosterone Enanthate' }
    ],
    female: [
      { id: 'testosterone-cypionate', name: 'Testosterone Cypionate' },
      { id: 'estradiol', name: 'Estradiol' },
      { id: 'progesterone', name: 'Progesterone' }
    ]
  };

  const HRT_DOSES = {
    male: [
      { id: '0.3ml-60mg', name: '0.3ml (60mg)' },
      { id: '0.35ml-70mg', name: '0.35ml (70mg)' },
      { id: '0.4ml-80mg', name: '0.4ml (80mg)' },
      { id: '0.5ml-100mg', name: '0.5ml (100mg)' }
    ],
    female: [
      { id: '0.1ml-10mg', name: '0.1ml (10mg)' },
      { id: '0.15ml-15mg', name: '0.15ml (15mg)' },
      { id: '0.2ml-20mg', name: '0.2ml (20mg)' },
      { id: '0.25ml-25mg', name: '0.25ml (25mg)' }
    ]
  };

  // Weight Loss Options
  const WL_MEDICATIONS = [
    { id: 'semaglutide', name: 'Semaglutide' },
    { id: 'tirzepatide', name: 'Tirzepatide' },
    { id: 'retatrutide', name: 'Retatrutide' }
  ];

  const WL_DOSES = {
    semaglutide: [
      { id: '0.25mg', name: '0.25mg' },
      { id: '0.5mg', name: '0.5mg' },
      { id: '1mg', name: '1mg' },
      { id: '1.7mg', name: '1.7mg' },
      { id: '2.4mg', name: '2.4mg' }
    ],
    tirzepatide: [
      { id: '2.5mg', name: '2.5mg' },
      { id: '5mg', name: '5mg' },
      { id: '7.5mg', name: '7.5mg' },
      { id: '10mg', name: '10mg' },
      { id: '12.5mg', name: '12.5mg' },
      { id: '15mg', name: '15mg' }
    ],
    retatrutide: [
      { id: '1mg', name: '1mg' },
      { id: '2mg', name: '2mg' },
      { id: '4mg', name: '4mg' },
      { id: '8mg', name: '8mg' },
      { id: '12mg', name: '12mg' }
    ]
  };

  // Session Pack Sizes (Red Light, HBOT)
  const SESSION_PACK_SIZES = [
    { id: 'single', name: 'Single Session' },
    { id: '5-pack', name: '5 Pack' },
    { id: '10-pack', name: '10 Pack' },
    { id: '20-pack', name: '20 Pack' }
  ];

  // Find template based on cascading selection
  const findTemplateFromCascade = (category, location, packSize) => {
    if (!category) return null;
    
    let searchName = '';
    
    if (category === 'injection' && location && packSize) {
      const locStr = location === 'in-clinic' ? 'In Clinic' : 'Take Home';
      const packStr = packSize === 'single' ? 'Single' : 
                      packSize === 'double' ? 'Double' : 
                      packSize === '4-pack' ? '4 Pack' :
                      packSize === '10-pack' ? '10 Pack' : '12 Pack';
      searchName = `Injection Therapy - ${packStr} (${locStr})`;
    } else if (category === 'peptide-7') {
      searchName = 'Peptide Therapy - 7 Day';
    } else if (category === 'peptide-10') {
      searchName = 'Peptide Therapy - 10 Day';
    } else if (category === 'peptide-14') {
      searchName = 'Peptide Therapy - 14 Day';
    } else if (category === 'peptide-20') {
      searchName = 'Peptide Therapy - 20 Day';
    } else if (category === 'peptide-30') {
      searchName = 'Peptide Therapy - 30 Day';
    } else if (category === 'peptide-vial') {
      searchName = 'Peptide Therapy - Vial';
    } else if (category === 'iv') {
      searchName = 'IV Therapy';
    } else if (category === 'hrt' && hrtGender && hrtSupplyType) {
      const genderStr = hrtGender === 'male' ? 'Male' : 'Female';
      const supplyStr = hrtSupplyType === 'vial' ? 'Vial' : 'Prefilled';
      searchName = `HRT - ${genderStr} - ${supplyStr}`;
    } else if (category === 'weight-loss' && wlMedication) {
      const medStr = wlMedication === 'semaglutide' ? 'Semaglutide' : 
                     wlMedication === 'tirzepatide' ? 'Tirzepatide' : 'Retatrutide';
      searchName = `Weight Loss - ${medStr}`;
    } else if (category === 'red-light' && sessionPackSize) {
      const packStr = sessionPackSize === 'single' ? 'Single' : 
                      sessionPackSize === '5-pack' ? '5 Pack' : 
                      sessionPackSize === '10-pack' ? '10 Pack' : '20 Pack';
      searchName = `Red Light Therapy - ${packStr}`;
    } else if (category === 'hbot' && sessionPackSize) {
      const packStr = sessionPackSize === 'single' ? 'Single' : 
                      sessionPackSize === '5-pack' ? '5 Pack' : 
                      sessionPackSize === '10-pack' ? '10 Pack' : '20 Pack';
      searchName = `HBOT - ${packStr}`;
    }
    
    const template = templates.find(t => 
      t.name.toLowerCase() === searchName.toLowerCase()
    );
    return template;
  };

  // Update template when cascade changes
  const handleCategoryChange = (category) => {
    setTemplateCategory(category);
    setTemplateLocation('');
    setTemplatePackSize('');
    setHrtGender('');
    setHrtSupplyType('');
    setHrtMedication('');
    setHrtDose('');
    setWlMedication('');
    setWlDose('');
    setSessionPackSize('');
    
    const cat = TEMPLATE_CATEGORIES.find(c => c.id === category);
    if (cat && !cat.hasLocation && !cat.hasPackSize && !['hrt', 'weight-loss', 'red-light', 'hbot', 'other'].includes(category)) {
      const template = findTemplateFromCascade(category, '', '');
      if (template) {
        setAssignForm({...assignForm, templateId: template.id, peptideId: '', selectedDose: ''});
      }
    } else {
      setAssignForm({...assignForm, templateId: '', peptideId: '', selectedDose: ''});
    }
  };

  const handleLocationChange = (location) => {
    setTemplateLocation(location);
    setTemplatePackSize('');
    setAssignForm({...assignForm, templateId: '', peptideId: '', selectedDose: ''});
  };

  const handlePackSizeChange = (packSize) => {
    setTemplatePackSize(packSize);
    const template = findTemplateFromCascade(templateCategory, templateLocation, packSize);
    if (template) {
      setAssignForm({...assignForm, templateId: template.id, peptideId: '', selectedDose: ''});
    }
  };

  // HRT Handlers
  const handleHrtGenderChange = (gender) => {
    setHrtGender(gender);
    setHrtSupplyType('');
    setHrtMedication('');
    setHrtDose('');
    setAssignForm({...assignForm, templateId: '', peptideId: '', selectedDose: ''});
  };

  const handleHrtSupplyChange = (supply) => {
    setHrtSupplyType(supply);
    setAssignForm({...assignForm, templateId: '', peptideId: '', selectedDose: ''});
    // Find template after supply type is selected
    setTimeout(() => {
      const genderStr = hrtGender === 'male' ? 'Male' : 'Female';
      const supplyStr = supply === 'vial' ? 'Vial' : 'Prefilled';
      const searchName = `HRT - ${genderStr} - ${supplyStr}`;
      const template = templates.find(t => t.name.toLowerCase() === searchName.toLowerCase());
      if (template) {
        setAssignForm(prev => ({...prev, templateId: template.id}));
      }
    }, 0);
  };

  // Weight Loss Handlers
  const handleWlMedicationChange = (medication) => {
    setWlMedication(medication);
    setWlDose('');
    setAssignForm({...assignForm, templateId: '', peptideId: '', selectedDose: ''});
    // Find template after medication is selected
    setTimeout(() => {
      const medStr = medication === 'semaglutide' ? 'Semaglutide' : 
                     medication === 'tirzepatide' ? 'Tirzepatide' : 'Retatrutide';
      const searchName = `Weight Loss - ${medStr}`;
      const template = templates.find(t => t.name.toLowerCase() === searchName.toLowerCase());
      if (template) {
        setAssignForm(prev => ({...prev, templateId: template.id}));
      }
    }, 0);
  };

  // Session Pack Handler (Red Light, HBOT)
  const handleSessionPackChange = (pack, type) => {
    setSessionPackSize(pack);
    const packStr = pack === 'single' ? 'Single' : 
                    pack === '5-pack' ? '5 Pack' : 
                    pack === '10-pack' ? '10 Pack' : '20 Pack';
    const searchName = type === 'red-light' ? `Red Light Therapy - ${packStr}` : `HBOT - ${packStr}`;
    const template = templates.find(t => t.name.toLowerCase() === searchName.toLowerCase());
    if (template) {
      setAssignForm({...assignForm, templateId: template.id, peptideId: '', selectedDose: ''});
    }
  };

  // Reset cascade when modal closes
  const resetCascade = () => {
    setTemplateCategory('');
    setTemplateLocation('');
    setTemplatePackSize('');
    setHrtGender('');
    setHrtSupplyType('');
    setHrtMedication('');
    setHrtDose('');
    setWlMedication('');
    setWlDose('');
    setSessionPackSize('');
    setSelectedPackId('');
    setExtendDays('');
    setAddToPackMode(false);
  };

  const [existingPacks, setExistingPacks] = useState([]);
  const [addToPackMode, setAddToPackMode] = useState(false);
  const [selectedPackId, setSelectedPackId] = useState('');
  const [extendDays, setExtendDays] = useState('');
  
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
    'NAD+',
    'Toradol'
  ];

  // Check if a purchase is a lab/blood draw purchase
  const isLabPurchase = (purchase) => {
    const name = (purchase.product_name || purchase.item_name || '').toLowerCase();
    return name.includes('blood') || 
           name.includes('lab') || 
           name.includes('panel') || 
           name.includes('draw') ||
           name.includes('elite') ||
           name.includes('essential');
  };

  // Determine lab order type from product name
  const getLabOrderType = (purchase) => {
    const name = (purchase.product_name || purchase.item_name || '').toLowerCase();
    if (name.includes('elite')) return 'Elite Panel';
    if (name.includes('essential')) return 'Essential Panel';
    if (name.includes('panel')) return 'Lab Panel';
    return 'Blood Draw';
  };

  // Handle marking a purchase as a lab order
  const handleMarkAsLabOrder = async (purchase) => {
    if (!purchase.patient_id) {
      alert('Cannot create lab order: Patient not linked. Please link this purchase to a patient first.');
      return;
    }
    
    try {
      const res = await fetch('/api/lab-orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purchaseId: purchase.id,
          patientId: purchase.patient_id,
          orderType: getLabOrderType(purchase)
        })
      });

      if (res.ok) {
        // Remove from needs protocol list
        setNeedsProtocol(needsProtocol.filter(p => p.id !== purchase.id));
      } else {
        const error = await res.json();
        console.error('Failed to create lab order:', error);
        alert('Failed to create lab order');
      }
    } catch (error) {
      console.error('Error creating lab order:', error);
      alert('Error creating lab order');
    }
  };

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
      const isHrt = templateCategory === 'hrt';
      const isWeightLoss = templateCategory === 'weight-loss';
      const isRedLight = templateCategory === 'red-light';
      const isHbot = templateCategory === 'hbot';
      const isTakeHome = templateLocation === 'take-home';
      const isInClinic = templateLocation === 'in-clinic';
      
      // Build medication and dose based on protocol type
      let medication = null;
      let selectedDose = assignForm.selectedDose;
      
      if (isInjection) {
        medication = assignForm.injectionMedication;
        selectedDose = assignForm.injectionDose;
      } else if (isHrt) {
        medication = HRT_MEDICATIONS[hrtGender]?.find(m => m.id === hrtMedication)?.name || hrtMedication;
        selectedDose = HRT_DOSES[hrtGender]?.find(d => d.id === hrtDose)?.name || hrtDose;
      } else if (isWeightLoss) {
        medication = WL_MEDICATIONS.find(m => m.id === wlMedication)?.name || wlMedication;
        selectedDose = WL_DOSES[wlMedication]?.find(d => d.id === wlDose)?.name || wlDose;
      }

      // Calculate sessions for in-clinic injections
      let totalSessions = null;
      if (isInjection && isInClinic) {
        totalSessions = templatePackSize === 'single' ? 1 : 
                        templatePackSize === 'double' ? 2 : 
                        templatePackSize === '4-pack' ? 4 :
                        templatePackSize === '10-pack' ? 10 : 
                        templatePackSize === '12-pack' ? 12 : null;
      } else if (isRedLight || isHbot) {
        totalSessions = sessionPackSize === 'single' ? 1 : 
                        sessionPackSize === '5-pack' ? 5 : 
                        sessionPackSize === '10-pack' ? 10 : 20;
      }

      // Calculate duration for take-home injections
      let supplyDuration = null;
      if (isInjection && isTakeHome && assignForm.supplyDuration) {
        supplyDuration = parseInt(assignForm.supplyDuration);
      }
      
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
          selectedDose: selectedDose,
          medication: medication,
          frequency: assignForm.frequency,
          startDate: assignForm.startDate,
          notes: assignForm.notes,
          // HRT specific
          hrtGender: isHrt ? hrtGender : null,
          hrtSupplyType: isHrt ? hrtSupplyType : null,
          // Weight Loss specific
          startWeight: isWeightLoss ? assignForm.startWeight : null,
          goalWeight: isWeightLoss ? assignForm.goalWeight : null,
          // Session-based (in-clinic injections, red light, hbot)
          totalSessions: totalSessions,
          // Supply duration (take-home injections)
          supplyDuration: supplyDuration,
          deliveryMethod: isTakeHome ? 'take_home' : (isInClinic ? 'in_clinic' : null)
        })
      });

      if (res.ok) {
        setShowAssignModal(false);
        resetCascade();
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

    const selectedPack = existingPacks.find(p => p.id === selectedPackId);
    const isTakeHome = selectedPack?.delivery_method === 'take_home';

    try {
      if (isTakeHome) {
        // Extend take-home pack by days
        if (!extendDays || extendDays <= 0) {
          alert('Please enter number of days to extend');
          return;
        }
        const res = await fetch(`/api/protocols/${selectedPackId}/extend`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            purchaseId: selectedPurchase.id,
            extendDays: parseInt(extendDays)
          })
        });

        const data = await res.json();
        
        if (res.ok) {
          setShowAssignModal(false);
          setExtendDays('');
          fetchData();
          alert(data.message || 'Supply extended');
        } else {
          alert(data.error || 'Failed to extend supply');
        }
      } else {
        // Add session to in-clinic pack
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
          <div style={styles.navLinks}>
            <Link href="/admin/patients" style={styles.navLink}>
              All Patients →
            </Link>
          </div>
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
                      {purchase.patient_id ? (
                        <Link href={`/admin/patient/${purchase.patient_id}`} style={{ textDecoration: 'none' }}>
                          <div style={styles.patientName}>{purchase.patient_name}</div>
                        </Link>
                      ) : (
                        <div style={{...styles.patientName, color: '#9ca3af', textDecoration: 'none', cursor: 'default'}}>
                          {purchase.patient_name || 'Unknown'}
                        </div>
                      )}
                      <div style={styles.productName}>{purchase.product_name}</div>
                      <div style={styles.meta}>
                        ${purchase.amount_paid?.toFixed(2)} • {formatDate(purchase.purchase_date)}
                        {purchase.category && ` • ${purchase.category}`}
                      </div>
                    </div>
                    <div style={styles.cardActions}>
                      {isLabPurchase(purchase) ? (
                        <button 
                          onClick={() => handleMarkAsLabOrder(purchase)}
                          style={styles.labButton}
                        >
                          Mark as Lab Order
                        </button>
                      ) : (
                        <button 
                          onClick={() => openAssignModal(purchase)}
                          style={styles.primaryButton}
                        >
                          Start Protocol
                        </button>
                      )}
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
              <div style={styles.activeList}>
                {/* Sort protocols by urgency: lowest days/sessions remaining first */}
                {[...activeProtocols].sort((a, b) => {
                  // Helper to parse date as local
                  const parseLocal = (dateStr) => {
                    if (!dateStr) return null;
                    const [year, month, day] = dateStr.split('T')[0].split('-').map(Number);
                    return new Date(year, month - 1, day);
                  };
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  
                  // Calculate days remaining for protocol a
                  const aEndDate = parseLocal(a.end_date);
                  const aDaysRemaining = aEndDate ? Math.round((aEndDate - today) / (1000 * 60 * 60 * 24)) : null;
                  const aSessionsRemaining = a.total_sessions ? (a.total_sessions - (a.sessions_used || 0)) : null;
                  const aUrgency = aDaysRemaining !== null ? aDaysRemaining : (aSessionsRemaining !== null ? aSessionsRemaining * 7 : 9999);
                  
                  // Calculate days remaining for protocol b
                  const bEndDate = parseLocal(b.end_date);
                  const bDaysRemaining = bEndDate ? Math.round((bEndDate - today) / (1000 * 60 * 60 * 24)) : null;
                  const bSessionsRemaining = b.total_sessions ? (b.total_sessions - (b.sessions_used || 0)) : null;
                  const bUrgency = bDaysRemaining !== null ? bDaysRemaining : (bSessionsRemaining !== null ? bSessionsRemaining * 7 : 9999);
                  
                  return aUrgency - bUrgency;
                }).map(protocol => {
                  const isTakeHome = protocol.delivery_method === 'take_home';
                  const isSessionBased = protocol.total_sessions && protocol.total_sessions > 0 && !isTakeHome;
                  const isWeightLoss = protocol.program_name?.toLowerCase().includes('weight') ||
                                       protocol.medication?.toLowerCase().includes('semaglutide') ||
                                       protocol.medication?.toLowerCase().includes('tirzepatide') ||
                                       protocol.medication?.toLowerCase().includes('retatrutide');
                  const isInjectionPack = protocol.program_name?.toLowerCase().includes('injection') && isSessionBased;
                  
                  // Time calculations - parse dates as local to avoid timezone issues
                  const parseLocalDate = (dateStr) => {
                    if (!dateStr) return null;
                    const [year, month, day] = dateStr.split('T')[0].split('-').map(Number);
                    return new Date(year, month - 1, day);
                  };
                  
                  const today = new Date();
                  today.setHours(0, 0, 0, 0); // Normalize to midnight
                  
                  const startDate = parseLocalDate(protocol.start_date);
                  const endDate = parseLocalDate(protocol.end_date);
                  
                  const totalDays = endDate && startDate 
                    ? Math.round((endDate - startDate) / (1000 * 60 * 60 * 24))
                    : null;
                  const daysRemaining = endDate 
                    ? Math.round((endDate - today) / (1000 * 60 * 60 * 24))
                    : null;
                  const daysPassed = startDate
                    ? Math.round((today - startDate) / (1000 * 60 * 60 * 24)) + 1  // +1 because day 1 is the start day
                    : 1;
                  
                  // Session tracking
                  const sessionsUsed = protocol.sessions_used || 0;
                  const totalSessions = protocol.total_sessions || 0;
                  const sessionsRemaining = totalSessions - sessionsUsed;
                  
                  // Progress calculation
                  let progressPercent = 0;
                  if (isSessionBased) {
                    progressPercent = (sessionsUsed / totalSessions) * 100;
                  } else if (totalDays && totalDays > 0) {
                    progressPercent = Math.min((daysPassed / totalDays) * 100, 100);
                  }
                  
                  // Status flags
                  const isOverdue = daysRemaining !== null && daysRemaining < 0;
                  const isLowSupply = isTakeHome && daysRemaining !== null && daysRemaining <= 7 && daysRemaining > 0;
                  const isEndingSoon = !isTakeHome && daysRemaining !== null && daysRemaining <= 3 && daysRemaining > 0;
                  
                  // Weight loss specific
                  const expectedInjections = isWeightLoss ? Math.floor(daysPassed / 7) + 1 : 0;
                  const injectionDue = isWeightLoss && isSessionBased && sessionsUsed < expectedInjections && sessionsUsed < totalSessions;
                  const isTitrationTime = isWeightLoss && sessionsUsed === 3;
                  
                  // Determine protocol type label
                  let typeLabel = 'Protocol';
                  let typeColor = '#6b7280';
                  if (isWeightLoss) {
                    typeLabel = 'Weight Loss';
                    typeColor = '#8b5cf6';
                  } else if (isInjectionPack) {
                    typeLabel = 'Injection Pack';
                    typeColor = '#3b82f6';
                  } else if (isTakeHome) {
                    typeLabel = 'Take Home';
                    typeColor = '#10b981';
                  } else if (protocol.program_name?.toLowerCase().includes('peptide')) {
                    typeLabel = 'Peptide';
                    typeColor = '#f59e0b';
                  }
                  
                  return (
                    <div key={protocol.id} style={{
                      ...styles.activeCardNew,
                      borderLeft: `4px solid ${typeColor}`
                    }}>
                      {/* Top Row: Patient + Type + Status */}
                      <div style={styles.activeCardTop}>
                        <div style={styles.activeCardLeft}>
                          {protocol.patient_id ? (
                            <Link href={`/admin/patient/${protocol.patient_id}`} style={{ textDecoration: 'none' }}>
                              <span style={styles.activePatientName}>{protocol.patient_name}</span>
                            </Link>
                          ) : (
                            <span style={{...styles.activePatientName, color: '#9ca3af'}}>
                              {protocol.patient_name || 'Unknown'}
                            </span>
                          )}
                          <span style={{...styles.typeLabel, background: `${typeColor}15`, color: typeColor}}>
                            {typeLabel}
                          </span>
                        </div>
                        <div style={styles.activeCardRight}>
                          {/* Status Badges */}
                          {isOverdue && (
                            <span style={styles.statusOverdue}>Overdue</span>
                          )}
                          {isLowSupply && (
                            <span style={styles.statusWarning}>Low Supply</span>
                          )}
                          {isEndingSoon && (
                            <span style={styles.statusWarning}>Ending Soon</span>
                          )}
                          {injectionDue && (
                            <span style={styles.statusDue}>Injection Due</span>
                          )}
                          {isTitrationTime && (
                            <span style={styles.statusTitration}>Titration</span>
                          )}
                          <button 
                            onClick={() => openEditModal(protocol)}
                            style={styles.editBtnSmall}
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                      
                      {/* Middle Row: Protocol Details */}
                      <Link href={`/admin/protocol/${protocol.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div style={styles.activeCardMiddle}>
                          <div style={styles.protocolName}>
                            {protocol.medication || protocol.program_name}
                          </div>
                          <div style={styles.protocolMeta}>
                            {protocol.selected_dose && <span>{protocol.selected_dose}</span>}
                            {protocol.selected_dose && protocol.frequency && <span> • </span>}
                            {protocol.frequency && <span>{protocol.frequency}</span>}
                          </div>
                        </div>
                      </Link>
                      
                      {/* Bottom Row: Progress Tracking */}
                      <div style={styles.activeCardBottom}>
                        {/* Progress Bar */}
                        <div style={styles.progressContainer}>
                          <div style={styles.progressBarNew}>
                            <div style={{
                              ...styles.progressFillNew, 
                              width: `${Math.min(progressPercent, 100)}%`,
                              background: isOverdue ? '#ef4444' : (progressPercent >= 75 ? '#22c55e' : '#3b82f6')
                            }}></div>
                          </div>
                        </div>
                        
                        {/* Tracking Info */}
                        <div style={styles.trackingInfo}>
                          {isSessionBased ? (
                            // Session-based tracking
                            <div style={styles.trackingGrid}>
                              <div style={styles.trackingStat}>
                                <span style={styles.trackingValue}>{sessionsUsed}</span>
                                <span style={styles.trackingLabel}>{isWeightLoss ? 'Injections' : 'Sessions'}</span>
                              </div>
                              <div style={styles.trackingDivider}>/</div>
                              <div style={styles.trackingStat}>
                                <span style={styles.trackingValue}>{totalSessions}</span>
                                <span style={styles.trackingLabel}>Total</span>
                              </div>
                              <div style={styles.trackingRemaining}>
                                <span style={{
                                  fontWeight: '600',
                                  color: sessionsRemaining <= 1 ? '#dc2626' : '#22c55e'
                                }}>
                                  {sessionsRemaining} left
                                </span>
                              </div>
                            </div>
                          ) : isTakeHome || totalDays ? (
                            // Time-based tracking
                            <div style={styles.trackingGrid}>
                              <div style={styles.trackingStat}>
                                <span style={styles.trackingValue}>{daysPassed}</span>
                                <span style={styles.trackingLabel}>Days In</span>
                              </div>
                              <div style={styles.trackingDivider}>/</div>
                              <div style={styles.trackingStat}>
                                <span style={styles.trackingValue}>{totalDays || '∞'}</span>
                                <span style={styles.trackingLabel}>Total</span>
                              </div>
                              <div style={styles.trackingRemaining}>
                                <span style={{
                                  fontWeight: '600',
                                  color: isOverdue ? '#dc2626' : (daysRemaining <= 7 ? '#f59e0b' : '#22c55e')
                                }}>
                                  {isOverdue 
                                    ? `${Math.abs(daysRemaining)} days over` 
                                    : `${daysRemaining} days left`
                                  }
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div style={styles.trackingOngoing}>
                              <span>Started {formatDate(protocol.start_date)}</span>
                            </div>
                          )}
                        </div>
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
                      {protocol.patient_id ? (
                        <Link href={`/admin/patient/${protocol.patient_id}`} style={{ textDecoration: 'none' }}>
                          <div style={styles.patientName}>{protocol.patient_name}</div>
                        </Link>
                      ) : (
                        <div style={{...styles.patientName, color: '#9ca3af', textDecoration: 'none', cursor: 'default'}}>
                          {protocol.patient_name || 'Unknown'}
                        </div>
                      )}
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
          <div style={styles.modalOverlay} onClick={() => { setShowAssignModal(false); resetCascade(); }}>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h3 style={styles.modalTitle}>Start Protocol</h3>
                <button onClick={() => { setShowAssignModal(false); resetCascade(); }} style={styles.closeButton}>×</button>
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
                          {existingPacks.map(pack => {
                            const isTakeHome = pack.delivery_method === 'take_home';
                            const daysLeft = pack.end_date ? Math.ceil((new Date(pack.end_date) - new Date()) / (1000 * 60 * 60 * 24)) : null;
                            return (
                              <option key={pack.id} value={pack.id}>
                                {pack.program_name} - {pack.medication || ''} 
                                {isTakeHome 
                                  ? ` (${daysLeft} days left)` 
                                  : ` (${pack.sessions_used || 0}/${pack.total_sessions} used)`
                                }
                              </option>
                            );
                          })}
                        </select>
                        {/* Show extend days input for take-home packs */}
                        {selectedPackId && existingPacks.find(p => p.id === selectedPackId)?.delivery_method === 'take_home' && (
                          <div style={{marginTop: '12px'}}>
                            <label style={styles.label}>Extend Supply By (days)</label>
                            <input 
                              type="number"
                              min="1"
                              value={extendDays || ''}
                              onChange={e => setExtendDays(e.target.value)}
                              placeholder="e.g., 30"
                              style={styles.input}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {!addToPackMode && (
                  <>
                    {/* Cascading Template Selection */}
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Protocol Type *</label>
                      <select 
                        value={templateCategory}
                        onChange={e => handleCategoryChange(e.target.value)}
                        style={styles.select}
                      >
                        <option value="">Select type...</option>
                        {TEMPLATE_CATEGORIES.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>

                    {templateCategory === 'injection' && (
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Location *</label>
                        <select 
                          value={templateLocation}
                          onChange={e => handleLocationChange(e.target.value)}
                          style={styles.select}
                        >
                          <option value="">Select location...</option>
                          {TEMPLATE_LOCATIONS.map(loc => (
                            <option key={loc.id} value={loc.id}>{loc.name}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {templateCategory === 'injection' && templateLocation && (
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Pack Size *</label>
                        <select 
                          value={templatePackSize}
                          onChange={e => handlePackSizeChange(e.target.value)}
                          style={styles.select}
                        >
                          <option value="">Select pack size...</option>
                          {TEMPLATE_PACK_SIZES.map(size => (
                            <option key={size.id} value={size.id}>{size.name}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Supply Duration for Take-Home Injections */}
                    {templateCategory === 'injection' && templateLocation === 'take-home' && templatePackSize && (
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Supply Duration (days) *</label>
                        <input 
                          type="number"
                          min="1"
                          value={assignForm.supplyDuration || ''}
                          onChange={e => setAssignForm({...assignForm, supplyDuration: e.target.value})}
                          placeholder="e.g., 30 for 1 month"
                          style={styles.input}
                        />
                        <div style={{fontSize: '12px', color: '#666', marginTop: '4px'}}>
                          How many days will this supply last?
                        </div>
                      </div>
                    )}

                    {/* HRT Protocol Inputs */}
                    {templateCategory === 'hrt' && (
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Gender *</label>
                        <select 
                          value={hrtGender}
                          onChange={e => handleHrtGenderChange(e.target.value)}
                          style={styles.select}
                        >
                          <option value="">Select gender...</option>
                          {HRT_GENDERS.map(g => (
                            <option key={g.id} value={g.id}>{g.name}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {templateCategory === 'hrt' && hrtGender && (
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Supply Type *</label>
                        <select 
                          value={hrtSupplyType}
                          onChange={e => handleHrtSupplyChange(e.target.value)}
                          style={styles.select}
                        >
                          <option value="">Select supply type...</option>
                          {HRT_SUPPLY_TYPES.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {templateCategory === 'hrt' && hrtGender && hrtSupplyType && (
                      <>
                        <div style={styles.formGroup}>
                          <label style={styles.label}>Medication *</label>
                          <select 
                            value={hrtMedication}
                            onChange={e => setHrtMedication(e.target.value)}
                            style={styles.select}
                          >
                            <option value="">Select medication...</option>
                            {(HRT_MEDICATIONS[hrtGender] || []).map(m => (
                              <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                          </select>
                        </div>

                        <div style={styles.formGroup}>
                          <label style={styles.label}>Dose *</label>
                          <select 
                            value={hrtDose}
                            onChange={e => setHrtDose(e.target.value)}
                            style={styles.select}
                          >
                            <option value="">Select dose...</option>
                            {(HRT_DOSES[hrtGender] || []).map(d => (
                              <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                          </select>
                        </div>

                        <div style={styles.formGroup}>
                          <label style={styles.label}>Frequency *</label>
                          <select 
                            value={assignForm.frequency || ''}
                            onChange={e => setAssignForm({...assignForm, frequency: e.target.value})}
                            style={styles.select}
                          >
                            <option value="">Select frequency...</option>
                            <option value="1x/week">1x per week</option>
                            <option value="2x/week">2x per week</option>
                            <option value="Every 2 weeks">Every 2 weeks</option>
                          </select>
                        </div>
                      </>
                    )}

                    {/* Weight Loss Program Inputs */}
                    {templateCategory === 'weight-loss' && (
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Medication *</label>
                        <select 
                          value={wlMedication}
                          onChange={e => handleWlMedicationChange(e.target.value)}
                          style={styles.select}
                        >
                          <option value="">Select medication...</option>
                          {WL_MEDICATIONS.map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {templateCategory === 'weight-loss' && wlMedication && (
                      <>
                        <div style={styles.formGroup}>
                          <label style={styles.label}>Starting Dose *</label>
                          <select 
                            value={wlDose}
                            onChange={e => setWlDose(e.target.value)}
                            style={styles.select}
                          >
                            <option value="">Select dose...</option>
                            {(WL_DOSES[wlMedication] || []).map(d => (
                              <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                          </select>
                        </div>

                        <div style={styles.formGroup}>
                          <label style={styles.label}>Starting Weight (lbs)</label>
                          <input 
                            type="number"
                            value={assignForm.startWeight || ''}
                            onChange={e => setAssignForm({...assignForm, startWeight: e.target.value})}
                            placeholder="Enter weight..."
                            style={styles.input}
                          />
                        </div>

                        <div style={styles.formGroup}>
                          <label style={styles.label}>Goal Weight (lbs)</label>
                          <input 
                            type="number"
                            value={assignForm.goalWeight || ''}
                            onChange={e => setAssignForm({...assignForm, goalWeight: e.target.value})}
                            placeholder="Enter goal weight..."
                            style={styles.input}
                          />
                        </div>
                      </>
                    )}

                    {/* Red Light Therapy Inputs */}
                    {templateCategory === 'red-light' && (
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Package Size *</label>
                        <select 
                          value={sessionPackSize}
                          onChange={e => handleSessionPackChange(e.target.value, 'red-light')}
                          style={styles.select}
                        >
                          <option value="">Select package...</option>
                          {SESSION_PACK_SIZES.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* HBOT Inputs */}
                    {templateCategory === 'hbot' && (
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Package Size *</label>
                        <select 
                          value={sessionPackSize}
                          onChange={e => handleSessionPackChange(e.target.value, 'hbot')}
                          style={styles.select}
                        >
                          <option value="">Select package...</option>
                          {SESSION_PACK_SIZES.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Show selected template confirmation */}
                    {assignForm.templateId && templateCategory !== 'other' && (
                      <div style={styles.templateConfirm}>
                        ✓ {templates.find(t => t.id === assignForm.templateId)?.name}
                      </div>
                    )}

                    {/* Other category shows full template list */}
                    {templateCategory === 'other' && (
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Select Template *</label>
                        <select 
                          value={assignForm.templateId}
                          onChange={e => setAssignForm({...assignForm, templateId: e.target.value, peptideId: '', selectedDose: ''})}
                          style={styles.select}
                        >
                          <option value="">Select template...</option>
                          {templates.filter(t => 
                            !t.name.includes('Injection Therapy') && 
                            !t.name.includes('Peptide Therapy') &&
                            !t.name.includes('Peptide Vial')
                          ).map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                        </select>
                      </div>
                    )}

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
                            {/* Group peptides by category */}
                            {(() => {
                              const categories = [...new Set(peptides.map(p => p.category || 'Other'))].sort();
                              return categories.map(category => (
                                <optgroup key={category} label={category}>
                                  {peptides
                                    .filter(p => (p.category || 'Other') === category)
                                    .sort((a, b) => a.name.localeCompare(b.name))
                                    .map(p => (
                                      <option key={p.id} value={p.id}>{p.name}</option>
                                    ))
                                  }
                                </optgroup>
                              ));
                            })()}
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
                <button onClick={() => { setShowAssignModal(false); resetCascade(); }} style={styles.cancelButton}>Cancel</button>
                {addToPackMode ? (
                  <button 
                    onClick={handleAddToPack}
                    disabled={!selectedPackId || (existingPacks.find(p => p.id === selectedPackId)?.delivery_method === 'take_home' && !extendDays)}
                    style={styles.primaryButton}
                  >
                    {existingPacks.find(p => p.id === selectedPackId)?.delivery_method === 'take_home' 
                      ? 'Extend Supply' 
                      : 'Add Session'}
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
                        {/* Group peptides by category */}
                        {(() => {
                          const categories = [...new Set(peptides.map(p => p.category || 'Other'))].sort();
                          return categories.map(category => (
                            <optgroup key={category} label={category}>
                              {peptides
                                .filter(p => (p.category || 'Other') === category)
                                .sort((a, b) => a.name.localeCompare(b.name))
                                .map(p => (
                                  <option key={p.id} value={p.id}>{p.name}</option>
                                ))
                              }
                            </optgroup>
                          ));
                        })()}
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

                {/* Sessions/Injections tracking for packs */}
                {editForm.totalSessions && (
                  <div style={styles.formGroup}>
                    <label style={styles.label}>
                      {selectedProtocol?.program_name?.toLowerCase().includes('weight') ? 'Injections' : 'Sessions'} Used (of {editForm.totalSessions})
                    </label>
                    <input 
                      type="number"
                      min="0"
                      max={editForm.totalSessions}
                      value={editForm.sessionsUsed}
                      onChange={e => setEditForm({...editForm, sessionsUsed: parseInt(e.target.value) || 0})}
                      style={styles.input}
                    />
                    {/* Titration alert for weight loss on 4th injection */}
                    {selectedProtocol?.program_name?.toLowerCase().includes('weight') && 
                     parseInt(editForm.sessionsUsed) === 4 && (
                      <div style={{marginTop: '8px', padding: '8px 12px', background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '6px', fontSize: '13px', color: '#92400e'}}>
                        ⚠️ 4th injection - discuss dose titration with patient
                      </div>
                    )}
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
    marginBottom: '24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  navLinks: {
    display: 'flex',
    gap: '16px'
  },
  navLink: {
    color: '#000',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '500',
    padding: '8px 16px',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    transition: 'background 0.2s'
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
  patientName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#000',
    cursor: 'pointer',
    textDecoration: 'underline',
    textDecorationColor: '#ccc',
    textUnderlineOffset: '2px'
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
  labButton: {
    background: '#1d4ed8',
    color: '#fff',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500'
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
  // New Active Protocol Styles
  activeList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  activeCardNew: {
    background: '#fff',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    padding: '16px 20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
  },
  activeCardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px'
  },
  activeCardLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  activeCardRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  activePatientName: {
    fontWeight: '600',
    fontSize: '15px',
    color: '#111'
  },
  typeLabel: {
    padding: '3px 10px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  statusOverdue: {
    padding: '3px 10px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '600',
    background: '#fee2e2',
    color: '#dc2626'
  },
  statusWarning: {
    padding: '3px 10px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '600',
    background: '#fef3c7',
    color: '#b45309'
  },
  statusDue: {
    padding: '3px 10px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '600',
    background: '#dbeafe',
    color: '#1d4ed8'
  },
  statusTitration: {
    padding: '3px 10px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '600',
    background: '#fef3c7',
    color: '#92400e'
  },
  editBtnSmall: {
    background: '#fff',
    border: '1px solid #d1d5db',
    padding: '4px 12px',
    borderRadius: '4px',
    fontSize: '12px',
    cursor: 'pointer',
    color: '#666'
  },
  activeCardMiddle: {
    marginBottom: '12px',
    cursor: 'pointer'
  },
  protocolName: {
    fontSize: '16px',
    fontWeight: '500',
    color: '#111',
    marginBottom: '2px'
  },
  protocolMeta: {
    fontSize: '13px',
    color: '#6b7280'
  },
  activeCardBottom: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  progressContainer: {
    flex: '0 0 120px'
  },
  progressBarNew: {
    width: '100%',
    height: '8px',
    background: '#e5e7eb',
    borderRadius: '4px',
    overflow: 'hidden'
  },
  progressFillNew: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.3s ease'
  },
  trackingInfo: {
    flex: 1
  },
  trackingGrid: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  trackingStat: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  trackingValue: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#111'
  },
  trackingLabel: {
    fontSize: '11px',
    color: '#9ca3af',
    textTransform: 'uppercase'
  },
  trackingDivider: {
    fontSize: '18px',
    color: '#d1d5db',
    fontWeight: '300'
  },
  trackingRemaining: {
    marginLeft: 'auto',
    fontSize: '14px'
  },
  trackingOngoing: {
    fontSize: '13px',
    color: '#6b7280'
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
  },
  templateConfirm: {
    background: '#f0fdf4',
    border: '1px solid #86efac',
    color: '#15803d',
    padding: '10px 14px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    marginBottom: '12px'
  }
};
