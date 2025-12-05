/*
 * Range Medical System - Styled to match intake form
 * 
 * IMPORTANT: Add this to pages/_app.js or pages/_document.js:
 * <link rel="preconnect" href="https://fonts.googleapis.com">
 * <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
 * <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
 */

import React, { useState, useEffect } from 'react';
import { Plus, Search, Calendar, TrendingUp, Users, DollarSign, AlertCircle, Activity, Syringe, Droplet, Sun, Wind, FileText, Bell, ChevronRight, X, Loader, Trash2 } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabaseClient = createClient(
  'https://teivfptpozltpqwahgdl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlaXZmcHRwb3psdHBxd2FoZ2RsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3MTMxNDksImV4cCI6MjA4MDI4OTE0OX0.NrI1AykMBOh91mM9BFvpSH0JwzGrkv5ADDkZinh0elc'
);

const RangeMedicalSystem = () => {
  const [activeView, setActiveView] = useState('dashboard');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingProtocolId, setEditingProtocolId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProtocol, setFilterProtocol] = useState('all');
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);
  const [showQuickAddPatient, setShowQuickAddPatient] = useState(false);
  const [addingPatient, setAddingPatient] = useState(false);
  const [selectedIntake, setSelectedIntake] = useState(null);
  const [showIntakePanel, setShowIntakePanel] = useState(false);
  const [medicalDocuments, setMedicalDocuments] = useState([]);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);
  const [documentNotes, setDocumentNotes] = useState('');
  const [documentType, setDocumentType] = useState('Blood Draw Consent');
  const [labProvider, setLabProvider] = useState('Primex');
  const [labTestType, setLabTestType] = useState('Male Elite');
  const [labTestDate, setLabTestDate] = useState(new Date().toISOString().split('T')[0]);
  const [labNotes, setLabNotes] = useState('');
  const [uploadingLab, setUploadingLab] = useState(false);
  const [showLabUpload, setShowLabUpload] = useState(false);
  const [labs, setLabs] = useState([]);
  const [selectedLabsForCompare, setSelectedLabsForCompare] = useState([]);
  
  // Comprehensive lab result tracking
  const [showLabResultEntry, setShowLabResultEntry] = useState(false);
  const [editingLabResult, setEditingLabResult] = useState(null);
  const [labResultData, setLabResultData] = useState({});
  const [referenceRanges, setReferenceRanges] = useState({});
  const [expandedLabSections, setExpandedLabSections] = useState({
    hormones: true, // Start with hormones expanded
    thyroid: false,
    bloodsugar: false,
    lipids: false,
    vitamins: false,
    inflammation: false,
    liver: false,
    kidney: false,
    electrolytes: false,
    cbc: false,
    iron: false,
    prostate: false
  });
  
  const [consentForms, setConsentForms] = useState([]);
  const [selectedConsent, setSelectedConsent] = useState(null);
  const [showConsentPanel, setShowConsentPanel] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const [importingPDF, setImportingPDF] = useState(false);
  const [pdfPreview, setPdfPreview] = useState(null);
  
  // New protocol form state
  const [newProtocol, setNewProtocol] = useState({
    patient_id: '',
    type: 'peptide',
    name: '',
    start_date: new Date().toISOString().split('T')[0],
    duration: '',
    status: 'active',
    price: '',
    dosing: '',
    injection_schedule: '',
    next_lab_date: '',
    notes: ''
  });

  // New patient form state
  const [newPatient, setNewPatient] = useState({
    name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    address: '',
    city: '',
    state: '',
    zip_code: ''
  });
  
  // Fetch patients and all their data from API
  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    if (selectedPatient) {
      fetchMedicalDocuments(selectedPatient.id);
      fetchConsentForms(selectedPatient.id);
      fetchLabs(selectedPatient.id);
      fetchReferenceRanges(selectedPatient.gender || 'Male');
    }
  }, [selectedPatient]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/patients');
      if (!response.ok) throw new Error('Failed to fetch patients');
      const data = await response.json();
      
      // Transform data to match component format
      const transformedData = data.map(patient => ({
        ...patient,
        dateOfBirth: patient.date_of_birth,
        protocols: patient.protocols.map(p => ({
          ...p,
          startDate: p.start_date,
          endDate: p.end_date,
          injectionSchedule: p.injection_schedule,
          currentDose: p.current_dose,
          targetDose: p.target_dose,
          nextDoseIncrease: p.next_dose_increase,
          nextLabDate: p.next_lab_date,
          sessionsTotal: p.sessions_total,
          sessionsCompleted: p.sessions_completed,
          lastSession: p.last_session,
          stripeId: p.stripe_transaction_id
        })),
        labs: patient.labs.map(l => ({
          date: l.lab_date,
          type: l.panel_type,
          results: l.results
        })),
        symptoms: patient.symptoms.map(s => ({
          date: s.symptom_date,
          energy: s.energy,
          mood: s.mood,
          sleep: s.sleep,
          recovery: s.recovery,
          libido: s.libido,
          brainfog: s.brain_fog,
          appetite: s.appetite,
          pain: s.pain,
          bloating: s.bloating
        })),
        measurements: patient.measurements.map(m => ({
          date: m.measurement_date,
          weight: m.weight,
          bodyFat: m.body_fat,
          waist: m.waist,
          bp: m.blood_pressure
        })),
        intakes: patient.intakes || []
      }));
      
      setPatients(transformedData);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching patients:', err);
    } finally {
      setLoading(false);
    }
  };

  const openIntakePanel = (intake) => {
    setSelectedIntake(intake);
    setShowIntakePanel(true);
  };

  const closeIntakePanel = () => {
    setShowIntakePanel(false);
    setTimeout(() => setSelectedIntake(null), 300);
  };

  const fetchMedicalDocuments = async (patientId) => {
    try {
      const response = await fetch(`/api/medical-documents?patient_id=${patientId}`);
      const result = await response.json();
      
      if (result.success) {
        setMedicalDocuments(result.documents);
      }
    } catch (error) {
      console.error('Error fetching medical documents:', error);
    }
  };

  const uploadDocumentToStorage = async (file) => {
    try {
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 8);
      const fileExtension = file.name.split('.').pop();
      const fileName = `doc-${timestamp}-${randomStr}.${fileExtension}`;
      const filePath = `medical-records/${fileName}`;

      console.log('Uploading file to:', filePath);

      const { data, error } = await supabaseClient.storage
        .from('medical-documents')
        .upload(filePath, file);

      if (error) {
        console.error('Upload error:', error);
        throw error;
      }

      const { data: urlData } = supabaseClient.storage
        .from('medical-documents')
        .getPublicUrl(filePath);

      console.log('File uploaded successfully:', urlData.publicUrl);
      return urlData.publicUrl;

    } catch (error) {
      console.error('Error uploading to storage:', error);
      throw error;
    }
  };

  const handleDocumentUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a PDF or image file (JPG, PNG, GIF, WEBP)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    try {
      setUploadingDocument(true);

      const documentUrl = await uploadDocumentToStorage(file);

      const response = await fetch('/api/medical-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: selectedPatient.id,
          document_name: file.name,
          document_url: documentUrl,
          document_type: documentType,
          notes: documentNotes || null,
          uploaded_by: 'Staff'
        })
      });

      const result = await response.json();

      if (result.success) {
        alert('Document uploaded successfully!');
        setDocumentNotes('');
        setDocumentType('Blood Draw Consent');
        setShowDocumentUpload(false);
        fetchMedicalDocuments(selectedPatient.id);
        e.target.value = '';
      } else {
        alert('Failed to save document: ' + result.error);
      }

    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload document. Please try again.');
    } finally {
      setUploadingDocument(false);
    }
  };

  // Lab functions
  const fetchLabs = async (patientId) => {
    try {
      const response = await fetch(`/api/labs?patient_id=${patientId}`);
      const result = await response.json();
      if (result.success) {
        setLabs(result.labs || []);
      }
    } catch (error) {
      console.error('Error fetching labs:', error);
    }
  };

  const handleLabUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    try {
      setUploadingLab(true);

      const labUrl = await uploadDocumentToStorage(file);

      const response = await fetch('/api/labs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: selectedPatient.id,
          lab_provider: labProvider,
          panel_type: labTestType,
          test_date: labTestDate,
          lab_url: labUrl,
          notes: labNotes || null
        })
      });

      const result = await response.json();

      if (result.success) {
        alert('Lab uploaded successfully!');
        setLabNotes('');
        setLabTestDate(new Date().toISOString().split('T')[0]);
        setShowLabUpload(false);
        fetchLabs(selectedPatient.id);
        e.target.value = '';
      } else {
        alert('Failed to save lab: ' + result.error);
      }

    } catch (error) {
      console.error('Lab upload error:', error);
      alert('Failed to upload lab. Please try again.');
    } finally {
      setUploadingLab(false);
    }
  };

  const toggleLabForCompare = (labId) => {
    if (selectedLabsForCompare.includes(labId)) {
      setSelectedLabsForCompare(selectedLabsForCompare.filter(id => id !== labId));
    } else {
      if (selectedLabsForCompare.length >= 2) {
        alert('You can only compare 2 labs at a time');
        return;
      }
      setSelectedLabsForCompare([...selectedLabsForCompare, labId]);
    }
  };

  // COMPREHENSIVE LAB RESULT TRACKING FUNCTIONS
  
  const fetchReferenceRanges = async (gender) => {
    try {
      const response = await fetch(`/api/labs/reference-ranges?gender=${gender}`);
      const result = await response.json();
      if (result.success) {
        setReferenceRanges(result.ranges || {});
      }
    } catch (error) {
      console.error('Error fetching reference ranges:', error);
    }
  };

  const initializeLabResultForm = (panelType) => {
    setLabResultData({
      panel_type: panelType,
      lab_provider: 'Primex',
      test_date: new Date().toISOString().split('T')[0],
      notes: ''
    });
  };

  const handleLabResultSubmit = async () => {
    // Validate required fields
    if (!selectedPatient?.id) {
      alert('Error: No patient selected');
      return;
    }
    
    if (!labResultData.panel_type) {
      alert('Please select a panel type');
      return;
    }
    
    if (!labResultData.test_date) {
      alert('Please select a test date');
      return;
    }

    try {
      // Convert empty strings to null
      const cleanedData = { ...labResultData };
      Object.keys(cleanedData).forEach(key => {
        if (cleanedData[key] === '') {
          cleanedData[key] = null;
        }
      });

      // Add patient_id
      cleanedData.patient_id = selectedPatient.id;

      // For updates, include the lab ID
      const method = editingLabResult ? 'PUT' : 'POST';
      const url = '/api/labs';
      
      if (editingLabResult) {
        cleanedData.id = editingLabResult.id;
      }

      console.log('Submitting lab data:', {
        patient_id: cleanedData.patient_id,
        panel_type: cleanedData.panel_type,
        test_date: cleanedData.test_date,
        method
      });

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanedData)
      });

      const result = await response.json();

      if (result.success) {
        alert(editingLabResult ? 'Lab results updated successfully!' : 'Lab results saved successfully!');
        setShowLabResultEntry(false);
        setEditingLabResult(null);
        fetchLabs(selectedPatient.id);
      } else {
        alert('Failed to save lab results: ' + result.error);
      }
    } catch (error) {
      console.error('Lab result submit error:', error);
      alert('Failed to save lab results. Please try again.');
    }
  };

  const handleEditLabResult = (lab) => {
    setEditingLabResult(lab);
    setLabResultData(lab);
    setShowLabResultEntry(true);
  };

  const handleDeleteLabResult = async (labId) => {
    if (!confirm('Are you sure you want to delete this lab result?')) return;

    try {
      const response = await fetch(`/api/labs?id=${labId}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (result.success) {
        alert('Lab result deleted successfully!');
        fetchLabs(selectedPatient.id);
      } else {
        alert('Failed to delete lab result: ' + result.error);
      }
    } catch (error) {
      console.error('Lab result delete error:', error);
      alert('Failed to delete lab result. Please try again.');
    }
  };

  const getValueStatus = (biomarker, value, gender) => {
    if (!value || !referenceRanges[biomarker]) return null;

    const numValue = parseFloat(value);
    if (isNaN(numValue)) return null;

    const range = referenceRanges[biomarker];
    
    // Check if value is in gender-specific or "Both" category
    if (range.gender !== 'Both' && range.gender !== gender) {
      return null;
    }

    return getStatusFromRange(numValue, range);
  };

  const getStatusFromRange = (value, range) => {
    // Critical: outside normal range
    if (value < range.min_value || value > range.max_value) {
      return {
        status: 'critical',
        color: '#dc2626',
        bgColor: '#fee2e2',
        label: value < range.min_value ? 'Low' : 'High',
        icon: '🔴'
      };
    }

    // Suboptimal: in normal range but outside optimal range
    if (range.optimal_min && range.optimal_max) {
      if (value < range.optimal_min || value > range.optimal_max) {
        return {
          status: 'suboptimal',
          color: '#ca8a04',
          bgColor: '#fef3c7',
          label: value < range.optimal_min ? 'Below Optimal' : 'Above Optimal',
          icon: '🟡'
        };
      }
    }

    // Optimal
    return {
      status: 'optimal',
      color: '#16a34a',
      bgColor: '#dcfce7',
      label: 'Optimal',
      icon: '🟢'
    };
  };

  const toggleLabSection = (section) => {
    setExpandedLabSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const fetchConsentForms = async (patientId) => {
    try {
      const response = await fetch(`/api/consent-forms?patient_id=${patientId}`);
      const result = await response.json();
      
      if (result.success) {
        setConsentForms(result.consents);
      }
    } catch (error) {
      console.error('Error fetching consent forms:', error);
    }
  };

  const openConsentPanel = (consent) => {
    setSelectedConsent(consent);
    setShowConsentPanel(true);
  };

  const closeConsentPanel = () => {
    setShowConsentPanel(false);
    setTimeout(() => setSelectedConsent(null), 300);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setIsEditMode(false);
    setEditingProtocolId(null);
    setNewProtocol({
      patient_id: '',
      type: 'peptide',
      name: '',
      start_date: new Date().toISOString().split('T')[0],
      duration: '',
      status: 'active',
      price: '',
      dosing: '',
      injection_schedule: '',
      next_lab_date: '',
      notes: ''
    });
  };

  const handleEditProtocol = (protocol) => {
    setIsEditMode(true);
    setEditingProtocolId(protocol.id);
    setNewProtocol({
      patient_id: protocol.patient_id,
      type: protocol.type,
      name: protocol.name,
      start_date: protocol.startDate || '',
      duration: protocol.duration || '',
      status: protocol.status,
      price: protocol.price || '',
      dosing: protocol.dosing || '',
      injection_schedule: protocol.injectionSchedule || '',
      next_lab_date: protocol.nextLabDate || '',
      notes: protocol.notes || ''
    });
    setShowAddModal(true);
  };

  const handleUpdateProtocol = async (e) => {
    e.preventDefault();
    
    if (!newProtocol.name || !newProtocol.price) {
      alert('Please fill in required fields: Protocol Name and Price');
      return;
    }

    try {
      setSubmitting(true);
      
      // Optimistic update - update UI immediately
      if (selectedPatient) {
        const updatedProtocols = selectedPatient.protocols.map(p => 
          p.id === editingProtocolId ? {
            ...p,
            name: newProtocol.name,
            type: newProtocol.type,
            startDate: newProtocol.start_date,
            duration: newProtocol.duration,
            status: newProtocol.status,
            price: newProtocol.price,
            dosing: newProtocol.dosing,
            injectionSchedule: newProtocol.injection_schedule,
            nextLabDate: newProtocol.next_lab_date,
            notes: newProtocol.notes
          } : p
        );
        
        setSelectedPatient({
          ...selectedPatient,
          protocols: updatedProtocols
        });
      }

      closeModal();
      alert('Protocol updated successfully!');

      // API call in background
      const response = await fetch('/api/protocols', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingProtocolId,
          ...newProtocol
        })
      });

      if (!response.ok) {
        // If API fails, revert and refetch
        alert('Failed to sync with server, refreshing...');
        await fetchPatients();
        throw new Error('Failed to update protocol');
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProtocol = async (protocolId) => {
    if (!confirm('Are you sure you want to delete this protocol? This cannot be undone.')) {
      return;
    }

    try {
      // Optimistic update - remove from UI immediately
      if (selectedPatient) {
        const updatedProtocols = selectedPatient.protocols.filter(p => p.id !== protocolId);
        setSelectedPatient({
          ...selectedPatient,
          protocols: updatedProtocols
        });
      }

      alert('Protocol deleted successfully!');

      // API call in background
      const response = await fetch('/api/protocols', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: protocolId })
      });

      if (!response.ok) {
        // If API fails, refetch to restore
        alert('Failed to sync with server, refreshing...');
        await fetchPatients();
        throw new Error('Failed to delete protocol');
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleAddProtocol = async (e) => {
    e.preventDefault();
    
    if (!newProtocol.patient_id || !newProtocol.name || !newProtocol.price) {
      alert('Please fill in required fields: Patient, Protocol Name, and Price');
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch('/api/protocols', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProtocol)
      });

      if (!response.ok) throw new Error('Failed to add protocol');

      // Refresh patients to show new protocol
      await fetchPatients();
      
      // Reset form
      setNewProtocol({
        patient_id: '',
        type: 'peptide',
        name: '',
        start_date: new Date().toISOString().split('T')[0],
        duration: '',
        status: 'active',
        price: '',
        dosing: '',
        injection_schedule: '',
        next_lab_date: '',
        notes: ''
      });
      
      closeModal();
      alert('Protocol added successfully!');
      
      // Refresh in background
      if (selectedPatient) {
        fetchPatients();
      }
    } catch (err) {
      alert('Error adding protocol: ' + err.message);
      console.error('Error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCSVImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      alert('Please upload a CSV file');
      return;
    }

    try {
      setImporting(true);
      setImportResults(null);

      // Read CSV file
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        alert('CSV file is empty or invalid');
        return;
      }

      // Parse CSV
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const patients = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const patient = {};
        
        headers.forEach((header, index) => {
          if (values[index]) {
            patient[header] = values[index];
          }
        });

        if (patient.email) {
          patients.push(patient);
        }
      }

      if (patients.length === 0) {
        alert('No valid patient data found in CSV');
        return;
      }

      // Send to API
      const response = await fetch('/api/patients/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patients })
      });

      const result = await response.json();

      if (result.success) {
        setImportResults(result);
        await fetchPatients();
        alert(`Import complete! Updated: ${result.summary.updated}, Created: ${result.summary.created}, Errors: ${result.summary.errors}`);
      } else {
        alert('Import failed: ' + result.error);
      }

      e.target.value = ''; // Reset file input
    } catch (error) {
      console.error('Import error:', error);
      alert('Failed to import CSV: ' + error.message);
    } finally {
      setImporting(false);
    }
  };

  const handleIntakePDFImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file');
      return;
    }

    try {
      setImportingPDF(true);

      // Read file as ArrayBuffer for PDF.js
      const arrayBuffer = await file.arrayBuffer();
      
      // Also read as base64 for storage
      const base64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result.split(',')[1];
          resolve(base64String);
        };
        reader.readAsDataURL(file);
      });

      // Use PDF.js to extract text (dynamically import to avoid SSR issues)
      const pdfjsLib = await import('pdfjs-dist/build/pdf');
      const pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.entry');
      pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';

      // Extract text from all pages with better formatting
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        // Build text with proper line breaks
        let lastY = null;
        const pageText = textContent.items.map(item => {
          const currentY = item.transform[5];
          let text = item.str;
          
          // Add line break if Y position changed significantly (new line)
          if (lastY !== null && Math.abs(currentY - lastY) > 5) {
            text = '\n' + text;
          }
          
          lastY = currentY;
          return text;
        }).join(' ');
        
        fullText += pageText + '\n\n';
      }

      // Show preview
      const nameMatch = fullText.match(/Name:\s*([^\n]+)/);
      const emailMatch = fullText.match(/Email:\s*([^\n]+)/);
      const dobMatch = fullText.match(/Date of Birth:\s*(\d{4}-\d{2}-\d{2})/);
      
      setPdfPreview({
        name: nameMatch ? nameMatch[1].trim() : 'Unknown',
        email: emailMatch ? emailMatch[1].trim() : 'Unknown',
        dob: dobMatch ? dobMatch[1] : 'Unknown',
        filename: file.name
      });

      // Ask for confirmation
      const confirmed = confirm(
        `Found intake form for:\n\nName: ${nameMatch ? nameMatch[1].trim() : 'Unknown'}\nEmail: ${emailMatch ? emailMatch[1].trim() : 'Unknown'}\nDOB: ${dobMatch ? dobMatch[1] : 'Unknown'}\n\nImport this intake form?`
      );

      if (!confirmed) {
        e.target.value = '';
        return;
      }

      // Send to API
      const response = await fetch('/api/intake/import-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdfText: fullText,
          pdfBase64: base64,
          filename: file.name
        })
      });

      const result = await response.json();

      if (result.success) {
        alert(`Success! ${result.message}\n\nPatient: ${result.extracted_data.personal.name}\nIntake created!`);
        await fetchPatients();
      } else {
        alert('Import failed: ' + result.error);
      }

      e.target.value = ''; // Reset file input
      setPdfPreview(null);

    } catch (error) {
      console.error('PDF import error:', error);
      alert('Failed to import PDF: ' + error.message);
    } finally {
      setImportingPDF(false);
    }
  };

  const handleAddPatient = async (e, fromQuickAdd = false) => {
    e.preventDefault();
    
    // Validation: Must have name and at least email OR phone
    if (!newPatient.name) {
      alert('Please enter patient name');
      return;
    }
    
    if (!newPatient.email && !newPatient.phone) {
      alert('Please enter at least an email OR phone number');
      return;
    }

    try {
      setAddingPatient(true);
      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPatient)
      });

      if (!response.ok) throw new Error('Failed to add patient');

      const addedPatient = await response.json();
      
      // Refresh patients list
      await fetchPatients();
      
      // Reset form
      setNewPatient({
        name: '',
        email: '',
        phone: '',
        date_of_birth: '',
        address: '',
        city: '',
        state: '',
        zip_code: ''
      });
      
      // Close modals
      setShowAddPatientModal(false);
      setShowQuickAddPatient(false);
      
      // If from quick-add, auto-select the new patient in protocol form
      if (fromQuickAdd && addedPatient.id) {
        setNewProtocol({...newProtocol, patient_id: addedPatient.id});
      }
      
      alert('Patient added successfully!');
    } catch (err) {
      alert('Error adding patient: ' + err.message);
      console.error('Error:', err);
    } finally {
      setAddingPatient(false);
    }
  };

  const handleDeletePatient = async (patientId) => {
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return;

    const confirmed = confirm(
      `Are you sure you want to DELETE ${patient.name}?\n\n` +
      `This will permanently delete:\n` +
      `- Patient record\n` +
      `- All protocols (${patient.protocols?.length || 0})\n` +
      `- All intake forms\n` +
      `- All documents\n` +
      `- All consent forms\n\n` +
      `THIS CANNOT BE UNDONE!`
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/patients/${patientId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete patient');
      }

      // Refresh patients list
      await fetchPatients();
      
      // Close patient view if this patient was selected
      if (selectedPatient?.id === patientId) {
        setSelectedPatient(null);
      }

      alert('Patient deleted successfully');
    } catch (err) {
      alert('Error deleting patient: ' + err.message);
      console.error('Error:', err);
    }
  };

  const handleDeleteIntake = async (intakeId) => {
    const confirmed = confirm(
      'Are you sure you want to delete this intake form?\n\n' +
      'This cannot be undone!'
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/intakes/${intakeId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete intake');
      }

      // Refresh patients list
      await fetchPatients();
      
      // Close intake panel
      setShowIntakePanel(false);
      setSelectedIntake(null);

      alert('Intake form deleted successfully');
    } catch (err) {
      alert('Error deleting intake: ' + err.message);
      console.error('Error:', err);
    }
  };

  // Calculate alerts
  const getAlerts = () => {
    const alerts = [];
    const today = new Date();
    
    patients.forEach(patient => {
      patient.protocols?.forEach(protocol => {
        if (protocol.type === 'hrt' && protocol.nextLabDate) {
          const labDate = new Date(protocol.nextLabDate);
          const daysUntil = Math.ceil((labDate - today) / (1000 * 60 * 60 * 24));
          
          if (daysUntil <= 7 && daysUntil > 0) {
            alerts.push({
              type: 'warning',
              patient: patient.name,
              message: `Labs due in ${daysUntil} days`,
              protocol: protocol.name,
              priority: 'medium'
            });
          } else if (daysUntil <= 0) {
            alerts.push({
              type: 'urgent',
              patient: patient.name,
              message: 'Labs overdue',
              protocol: protocol.name,
              priority: 'high'
            });
          }
        }
        
        if (protocol.duration) {
          const startDate = new Date(protocol.startDate);
          const endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + protocol.duration);
          const daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
          
          if (daysRemaining <= 3 && daysRemaining > 0) {
            alerts.push({
              type: 'info',
              patient: patient.name,
              message: `Protocol ending in ${daysRemaining} days`,
              protocol: protocol.name,
              priority: 'medium'
            });
          }
        }
        
        if (protocol.nextDoseIncrease) {
          const doseDate = new Date(protocol.nextDoseIncrease);
          const daysUntil = Math.ceil((doseDate - today) / (1000 * 60 * 60 * 24));
          
          if (daysUntil <= 7 && daysUntil > 0) {
            alerts.push({
              type: 'info',
              patient: patient.name,
              message: `Dose increase due in ${daysUntil} days`,
              protocol: protocol.name,
              priority: 'medium'
            });
          }
        }
      });
      
      if (patient.symptoms?.length > 0) {
        const lastSymptom = new Date(patient.symptoms[0].date);
        const daysSince = Math.ceil((today - lastSymptom) / (1000 * 60 * 60 * 24));
        
        if (daysSince > 10) {
          alerts.push({
            type: 'info',
            patient: patient.name,
            message: `No symptom check-in for ${daysSince} days`,
            priority: 'low'
          });
        }
      }
    });
    
    return alerts.sort((a, b) => {
      const priority = { high: 3, medium: 2, low: 1 };
      return priority[b.priority] - priority[a.priority];
    });
  };

  const getProtocolStats = () => {
    const stats = {
      peptide: 0,
      hrt: 0,
      weightloss: 0,
      iv: 0,
      hbot: 0,
      rlt: 0,
      total: 0
    };
    
    patients.forEach(patient => {
      patient.protocols?.forEach(protocol => {
        if (protocol.status === 'active') {
          stats[protocol.type]++;
          stats.total++;
        }
      });
    });
    
    return stats;
  };

  const getRevenueData = () => {
    let total = 0;
    const byType = {
      peptide: 0,
      hrt: 0,
      weightloss: 0,
      iv: 0,
      hbot: 0,
      rlt: 0
    };
    
    patients.forEach(patient => {
      patient.protocols?.forEach(protocol => {
        const price = parseFloat(protocol.price) || 0;
        total += price;
        byType[protocol.type] = (byType[protocol.type] || 0) + price;
      });
    });
    
    return { total, byType };
  };

  const protocolStats = getProtocolStats();
  const alerts = getAlerts();
  const revenueData = getRevenueData();
  
  const protocolTypes = {
    peptide: { icon: Syringe, label: 'Peptides', color: '#000000' },
    hrt: { icon: Activity, label: 'HRT', color: '#000000' },
    weightloss: { icon: TrendingUp, label: 'Weight Loss', color: '#000000' },
    iv: { icon: Droplet, label: 'IV Therapy', color: '#000000' },
    hbot: { icon: Wind, label: 'HBOT', color: '#000000' },
    rlt: { icon: Sun, label: 'Red Light', color: '#000000' }
  };

  const filteredPatients = patients.filter(patient =>
    patient.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <Loader size={48} style={{ animation: 'spin 1s linear infinite' }} />
        <div style={{ fontSize: '1rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
          Loading Range Medical System...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '1rem',
        padding: '2rem'
      }}>
        <AlertCircle size={48} />
        <div style={{ fontSize: '1rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
          Error Loading System
        </div>
        <div style={{ fontSize: '0.9rem', color: '#666666', textAlign: 'center', maxWidth: '500px' }}>
          {error}
        </div>
        <button 
          onClick={fetchPatients}
          style={{
            padding: '0.75rem 1.5rem',
            border: '2px solid #000000',
            background: '#000000',
            color: '#ffffff',
            fontWeight: 700,
            cursor: 'pointer',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            fontSize: '0.8rem',
            marginTop: '1rem'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  // The rest of the component remains the same as the previous version
  // Just using the fetched data from the backend instead of hardcoded data
  
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#f5f5f5',
      fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
      color: '#171717',
      padding: '2rem'
    }}>
      {/* Patient Detail View */}
      {selectedPatient && (
        <div>
          {/* Back Button */}
          <button 
            className="btn"
            onClick={() => setSelectedPatient(null)}
            style={{ marginBottom: '1.5rem' }}
          >
            <ChevronRight size={16} style={{ transform: 'rotate(180deg)' }} />
            Back to Patients
          </button>

          {/* Patient Header */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
                  {selectedPatient.name}
                </h2>
                <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div style={{ fontSize: '0.9rem', color: '#666666' }}>{selectedPatient.email}</div>
                  {selectedPatient.phone && <div style={{ fontSize: '0.9rem', color: '#666666' }}>{selectedPatient.phone}</div>}
                  {selectedPatient.dateOfBirth && (
                    <div style={{ fontSize: '0.85rem', color: '#666666' }}>
                      DOB: {new Date(selectedPatient.dateOfBirth).toLocaleDateString('en-US')}
                    </div>
                  )}
                  {(selectedPatient.address || selectedPatient.city || selectedPatient.state || selectedPatient.zip_code) && (
                    <div style={{ fontSize: '0.85rem', color: '#666666' }}>
                      {selectedPatient.address && `${selectedPatient.address}`}
                      {(selectedPatient.city || selectedPatient.state || selectedPatient.zip_code) && (
                        <>
                          {selectedPatient.address && ', '}
                          {selectedPatient.city && selectedPatient.city}
                          {selectedPatient.state && `, ${selectedPatient.state}`}
                          {selectedPatient.zip_code && ` ${selectedPatient.zip_code}`}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: '#666666', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>
                    Active Protocols
                  </div>
                  <div style={{ fontFamily: 'DM Sans', fontSize: '1.75rem', fontWeight: 700 }}>
                    {selectedPatient.protocols?.filter(p => p.status === 'active').length || 0}
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: '#666666', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>
                    Total Protocols
                  </div>
                  <div style={{ fontFamily: 'DM Sans', fontSize: '1.75rem', fontWeight: 700 }}>
                    {selectedPatient.protocols?.length || 0}
                  </div>
                </div>
              </div>
            </div>
            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e0e0e0', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => handleDeletePatient(selectedPatient.id)}
                style={{
                  background: '#dc2626',
                  color: '#ffffff',
                  border: '2px solid #dc2626',
                  padding: '0.75rem 1.5rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <Trash2 size={16} />
                Delete Patient
              </button>
            </div>
          </div>

          {/* Protocols Section */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', letterSpacing: '1px' }}>
                Treatment Protocols
              </h3>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setIsEditMode(false);
                  setEditingProtocolId(null);
                  setNewProtocol({
                    patient_id: selectedPatient.id,
                    type: 'peptide',
                    name: '',
                    start_date: new Date().toISOString().split('T')[0], // Always TODAY!
                    duration: '',
                    status: 'active',
                    price: '',
                    dosing: '',
                    injection_schedule: '',
                    next_lab_date: '',
                    notes: ''
                  });
                  setShowAddModal(true);
                }}
                style={{ fontSize: '0.75rem', padding: '0.5rem 0.75rem' }}
              >
                <Plus size={14} />
                Add Protocol
              </button>
            </div>
            
            {selectedPatient.protocols && selectedPatient.protocols.length > 0 ? (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {selectedPatient.protocols.map(protocol => {
                  const getProtocolIcon = (type) => {
                    switch(type) {
                      case 'peptide': return <Syringe size={20} />;
                      case 'hrt': return <Activity size={20} />;
                      case 'weightloss': return <TrendingUp size={20} />;
                      case 'iv': return <Droplet size={20} />;
                      case 'hbot': return <Wind size={20} />;
                      case 'rlt': return <Sun size={20} />;
                      default: return <FileText size={20} />;
                    }
                  };

                  const statusColor = protocol.status === 'active' ? '#000000' : '#999999';
                  const statusBg = protocol.status === 'active' ? '#ffffff' : '#f5f5f5';

                  return (
                    <div 
                      key={protocol.id} 
                      style={{ 
                        padding: '1.25rem', 
                        border: `2px solid ${statusColor}`,
                        background: statusBg
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'start' }}>
                          <div style={{ marginTop: '0.15rem', color: statusColor }}>
                            {getProtocolIcon(protocol.type)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '1rem', textTransform: 'uppercase', color: statusColor }}>
                              {protocol.name}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#666666', textTransform: 'uppercase', marginTop: '0.25rem' }}>
                              {protocol.type}
                            </div>
                          </div>
                        </div>
                        <div style={{ 
                          padding: '0.35rem 0.75rem', 
                          border: `2px solid ${statusColor}`, 
                          fontSize: '0.7rem', 
                          fontWeight: 700, 
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          background: protocol.status === 'active' ? '#000000' : '#ffffff',
                          color: protocol.status === 'active' ? '#ffffff' : '#000000'
                        }}>
                          {protocol.status}
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', fontSize: '0.85rem' }}>
                        {protocol.startDate && (
                          <div>
                            <div style={{ color: '#666666', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>Start Date</div>
                            <div style={{ fontFamily: 'DM Sans', fontWeight: 700 }}>
                              {new Date(protocol.startDate).toLocaleDateString('en-US')}
                            </div>
                          </div>
                        )}
                        {protocol.duration && (
                          <div>
                            <div style={{ color: '#666666', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>Duration</div>
                            <div style={{ fontFamily: 'DM Sans', fontWeight: 700 }}>{protocol.duration} days</div>
                          </div>
                        )}
                        {protocol.price && (
                          <div>
                            <div style={{ color: '#666666', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>Price</div>
                            <div style={{ fontFamily: 'DM Sans', fontWeight: 700 }}>${protocol.price}</div>
                          </div>
                        )}
                        {protocol.dosing && (
                          <div>
                            <div style={{ color: '#666666', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>Dosing</div>
                            <div style={{ fontFamily: 'DM Sans', fontWeight: 700 }}>{protocol.dosing}</div>
                          </div>
                        )}
                        {protocol.injectionSchedule && (
                          <div>
                            <div style={{ color: '#666666', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>Schedule</div>
                            <div style={{ fontFamily: 'DM Sans', fontWeight: 700 }}>{protocol.injectionSchedule}</div>
                          </div>
                        )}
                        {protocol.nextLabDate && (
                          <div>
                            <div style={{ color: '#666666', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>Next Lab</div>
                            <div style={{ fontFamily: 'DM Sans', fontWeight: 700 }}>
                              {new Date(protocol.nextLabDate).toLocaleDateString('en-US')}
                            </div>
                          </div>
                        )}
                      </div>

                      {protocol.notes && (
                        <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#fafafa', border: '1px solid #e0e0e0' }}>
                          <div style={{ fontSize: '0.75rem', color: '#666666', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.35rem' }}>
                            Notes
                          </div>
                          <div style={{ fontSize: '0.85rem' }}>{protocol.notes}</div>
                        </div>
                      )}

                      {/* Edit and Delete Buttons */}
                      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e0e0e0' }}>
                        <button
                          onClick={() => handleEditProtocol(protocol)}
                          className="btn"
                          style={{ 
                            fontSize: '0.75rem', 
                            padding: '0.5rem 1rem',
                            background: '#ffffff',
                            color: '#000000',
                            border: '2px solid #000000',
                            flex: 1
                          }}
                        >
                          Edit Protocol
                        </button>
                        <button
                          onClick={() => handleDeleteProtocol(protocol.id)}
                          className="btn"
                          style={{ 
                            fontSize: '0.75rem', 
                            padding: '0.5rem 1rem',
                            background: '#dc2626',
                            color: '#ffffff',
                            border: '2px solid #dc2626',
                            flex: 1
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#666666' }}>
                No protocols found for this patient
              </div>
            )}
          </div>

          {/* Labs Section */}
          {selectedPatient.labs && selectedPatient.labs.length > 0 && (
            <div className="card" style={{ marginTop: '1.5rem' }}>
              <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.125rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', letterSpacing: '1px' }}>
                Lab Results
              </h3>
              <div style={{ display: 'grid', gap: '1rem' }}>
                {selectedPatient.labs.map((lab, index) => (
                  <div key={index} style={{ padding: '1rem', border: '2px solid #000000' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <div style={{ fontWeight: 700, textTransform: 'uppercase' }}>{lab.type}</div>
                      <div style={{ fontFamily: 'DM Sans', fontSize: '0.9rem' }}>
                        {new Date(lab.date).toLocaleDateString('en-US')}
                      </div>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#666666' }}>
                      {Object.keys(lab.results || {}).length} values recorded
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Measurements Section */}
          {selectedPatient.measurements && selectedPatient.measurements.length > 0 && (
            <div className="card" style={{ marginTop: '1.5rem' }}>
              <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.125rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', letterSpacing: '1px' }}>
                Body Measurements
              </h3>
              <div style={{ display: 'grid', gap: '1rem' }}>
                {selectedPatient.measurements.slice(0, 5).map((measurement, index) => (
                  <div key={index} style={{ padding: '1rem', border: '2px solid #000000' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                      <div style={{ fontFamily: 'DM Sans', fontWeight: 700 }}>
                        {new Date(measurement.date).toLocaleDateString('en-US')}
                      </div>
                      <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem' }}>
                        {measurement.weight && (
                          <div>
                            <span style={{ color: '#666666' }}>Weight:</span> <span style={{ fontFamily: 'DM Sans', fontWeight: 700 }}>{measurement.weight} lbs</span>
                          </div>
                        )}
                        {measurement.bodyFat && (
                          <div>
                            <span style={{ color: '#666666' }}>Body Fat:</span> <span style={{ fontFamily: 'DM Sans', fontWeight: 700 }}>{measurement.bodyFat}%</span>
                          </div>
                        )}
                        {measurement.waist && (
                          <div>
                            <span style={{ color: '#666666' }}>Waist:</span> <span style={{ fontFamily: 'DM Sans', fontWeight: 700 }}>{measurement.waist}"</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Intake Forms Section */}
          {selectedPatient.intakes && selectedPatient.intakes.length > 0 && (
            <div className="card" style={{ marginTop: '1.5rem' }}>
              <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.125rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', letterSpacing: '1px' }}>
                Medical Intake Forms
              </h3>
              <div style={{ display: 'grid', gap: '1rem' }}>
                {selectedPatient.intakes.map((intake, index) => (
                  <div 
                    key={intake.id || index} 
                    onClick={() => openIntakePanel(intake)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#fafafa';
                      e.currentTarget.style.transform = 'translateX(4px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#ffffff';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                    style={{ 
                      padding: '1.25rem', 
                      border: '2px solid #000000', 
                      background: '#ffffff',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '1rem', textTransform: 'uppercase' }}>
                          Medical Intake Form
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#666666', marginTop: '0.25rem' }}>
                          Submitted: {new Date(intake.submitted_at).toLocaleDateString('en-US')}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <div style={{ 
                          padding: '0.35rem 0.75rem', 
                          border: '2px solid #000000', 
                          fontSize: '0.7rem', 
                          fontWeight: 700, 
                          textTransform: 'uppercase',
                          background: '#000000',
                          color: '#ffffff'
                        }}>
                          ✓ COMPLETED
                        </div>
                        <ChevronRight size={20} style={{ color: '#666666' }} />
                      </div>
                    </div>

                    {/* Chief Complaint Preview */}
                    {intake.what_brings_you && (
                      <div style={{ marginBottom: '1rem', padding: '0.75rem', background: '#fafafa', border: '1px solid #e0e0e0' }}>
                        <div style={{ fontSize: '0.75rem', color: '#666666', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.35rem' }}>
                          Chief Complaint
                        </div>
                        <div style={{ fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {intake.what_brings_you}
                        </div>
                      </div>
                    )}

                    {/* Quick Info */}
                    <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem', color: '#666666', flexWrap: 'wrap' }}>
                      {intake.date_of_birth && (
                        <span>DOB: {new Date(intake.date_of_birth).toLocaleDateString('en-US')}</span>
                      )}
                      {intake.gender && (
                        <span>Gender: {intake.gender}</span>
                      )}
                      {intake.injured && (
                        <span style={{ color: '#dc2626', fontWeight: 600 }}>⚠️ Current Injury</span>
                      )}
                    </div>

                    <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#666666', fontStyle: 'italic' }}>
                      Click to view full details →
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Medical Documents Section */}
          <div className="card" style={{ marginTop: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', letterSpacing: '1px' }}>
                Medical Documents
              </h3>
              <button
                className="btn btn-primary"
                onClick={() => setShowDocumentUpload(!showDocumentUpload)}
                style={{ fontSize: '0.75rem', padding: '0.5rem 0.75rem' }}
              >
                <Plus size={14} />
                Upload Document
              </button>
            </div>

            {showDocumentUpload && (
              <div style={{ 
                padding: '1.25rem', 
                background: '#fafafa', 
                border: '2px solid #000000', 
                marginBottom: '1.5rem' 
              }}>
                <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', fontWeight: 700 }}>
                  Upload Medical Document
                </h4>
                
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '0.75rem', 
                    fontWeight: 600, 
                    textTransform: 'uppercase', 
                    marginBottom: '0.5rem' 
                  }}>
                    Document Type
                  </label>
                  <select
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #000000',
                      fontFamily: 'inherit',
                      fontSize: '0.9rem',
                      background: '#ffffff',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="Blood Draw Consent">Blood Draw Consent</option>
                    <option value="Peptide Consent">Peptide Consent</option>
                    <option value="HRT Consent">HRT Consent</option>
                    <option value="IV & Injection Consent">IV & Injection Consent</option>
                    <option value="Weight Loss Consent">Weight Loss Consent</option>
                    <option value="HBOT Consent">HBOT Consent</option>
                    <option value="Red Light Therapy Consent">Red Light Therapy Consent</option>
                    <option value="PRP Consent">PRP Consent</option>
                    <option value="Intake Form">Intake Form</option>
                    <option value="Lab Results">Lab Results</option>
                    <option value="Other Medical Document">Other Medical Document</option>
                  </select>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '0.75rem', 
                    fontWeight: 600, 
                    textTransform: 'uppercase', 
                    marginBottom: '0.5rem' 
                  }}>
                    Document Notes (Optional)
                  </label>
                  <textarea
                    value={documentNotes}
                    onChange={(e) => setDocumentNotes(e.target.value)}
                    placeholder="Add notes about this document (e.g., 'Lab results from 2023', 'Previous X-ray')"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #000000',
                      fontFamily: 'inherit',
                      fontSize: '0.9rem',
                      resize: 'vertical',
                      minHeight: '80px'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '0.75rem', 
                    fontWeight: 600, 
                    textTransform: 'uppercase', 
                    marginBottom: '0.5rem' 
                  }}>
                    Select File (PDF or Image)
                  </label>
                  <input
                    type="file"
                    accept="application/pdf,image/*"
                    onChange={handleDocumentUpload}
                    disabled={uploadingDocument}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #000000',
                      fontFamily: 'inherit',
                      fontSize: '0.9rem',
                      cursor: uploadingDocument ? 'not-allowed' : 'pointer'
                    }}
                  />
                </div>

                {uploadingDocument && (
                  <div style={{ 
                    padding: '0.75rem', 
                    background: '#dbeafe', 
                    border: '1px solid #3b82f6',
                    fontSize: '0.85rem',
                    fontWeight: 600
                  }}>
                    <Loader size={14} style={{ animation: 'spin 1s linear infinite', display: 'inline', marginRight: '0.5rem' }} />
                    Uploading document...
                  </div>
                )}

                <div style={{ fontSize: '0.75rem', color: '#666666', marginTop: '0.75rem' }}>
                  • PDF files only<br />
                  • Maximum file size: 10MB<br />
                  • Document will be associated with this patient
                </div>
              </div>
            )}

            {medicalDocuments.length > 0 ? (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {medicalDocuments.map((doc) => (
                  <div 
                    key={doc.id}
                    style={{ 
                      padding: '1.25rem', 
                      border: '2px solid #000000', 
                      background: '#ffffff',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'start'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <FileText size={20} />
                        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                          {doc.document_name}
                        </div>
                      </div>
                      
                      <div style={{ fontSize: '0.75rem', color: '#666666', marginBottom: '0.5rem' }}>
                        Uploaded: {new Date(doc.uploaded_at).toLocaleDateString('en-US')} {new Date(doc.uploaded_at).toLocaleTimeString()}
                      </div>

                      {doc.notes && (
                        <div style={{ 
                          fontSize: '0.85rem', 
                          color: '#444444',
                          marginTop: '0.5rem',
                          padding: '0.5rem',
                          background: '#fafafa',
                          border: '1px solid #e0e0e0'
                        }}>
                          <strong>Notes:</strong> {doc.notes}
                        </div>
                      )}

                      {doc.uploaded_by && (
                        <div style={{ fontSize: '0.75rem', color: '#666666', marginTop: '0.5rem' }}>
                          Uploaded by: {doc.uploaded_by}
                        </div>
                      )}
                    </div>

                    <a
                      href={doc.document_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary"
                      style={{ fontSize: '0.75rem', padding: '0.5rem 0.75rem', marginLeft: '1rem' }}
                    >
                      <FileText size={14} />
                      View PDF
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ 
                padding: '2rem', 
                textAlign: 'center', 
                color: '#666666', 
                fontSize: '0.9rem',
                fontStyle: 'italic'
              }}>
                No medical documents uploaded yet.
              </div>
            )}
          </div>

          {/* Labs Section */}
          <div className="card" style={{ marginTop: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', letterSpacing: '1px' }}>
                Laboratory Results
              </h3>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                {selectedLabsForCompare.length === 2 && (
                  <button
                    className="btn"
                    onClick={() => window.open(`/compare-labs?ids=${selectedLabsForCompare.join(',')}`, '_blank')}
                    style={{ fontSize: '0.75rem', padding: '0.5rem 0.75rem', background: '#10b981', border: '2px solid #10b981' }}
                  >
                    Compare Selected ({selectedLabsForCompare.length})
                  </button>
                )}
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    initializeLabResultForm(selectedPatient.gender === 'Female' ? 'Female Elite' : 'Male Elite');
                    setShowLabResultEntry(true);
                  }}
                  style={{ fontSize: '0.75rem', padding: '0.5rem 0.75rem' }}
                >
                  <Plus size={14} />
                  Enter Lab Values
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setLabTestType(selectedPatient.gender === 'Female' ? 'Female Elite' : 'Male Elite');
                    setLabProvider('Primex');
                    setLabTestDate(new Date().toISOString().split('T')[0]);
                    setShowLabUpload(!showLabUpload);
                  }}
                  style={{ fontSize: '0.75rem', padding: '0.5rem 0.75rem' }}
                >
                  <Plus size={14} />
                  Upload Lab PDF
                </button>
              </div>
            </div>

            {showLabUpload && (
              <div style={{ 
                padding: '1.25rem', 
                background: '#fafafa', 
                border: '2px solid #000000', 
                marginBottom: '1.5rem' 
              }}>
                <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', fontWeight: 700 }}>
                  Upload Laboratory Result
                </h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      fontSize: '0.75rem', 
                      fontWeight: 600, 
                      textTransform: 'uppercase', 
                      marginBottom: '0.5rem' 
                    }}>
                      Lab Provider
                    </label>
                    <select
                      value={labProvider}
                      onChange={(e) => setLabProvider(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '2px solid #000000',
                        fontFamily: 'inherit',
                        fontSize: '0.9rem',
                        background: '#ffffff',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="Primex">Primex</option>
                      <option value="Access Med Labs">Access Med Labs</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ 
                      display: 'block', 
                      fontSize: '0.75rem', 
                      fontWeight: 600, 
                      textTransform: 'uppercase', 
                      marginBottom: '0.5rem' 
                    }}>
                      Panel Type
                    </label>
                    <select
                      value={labTestType}
                      onChange={(e) => setLabTestType(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '2px solid #000000',
                        fontFamily: 'inherit',
                        fontSize: '0.9rem',
                        background: '#ffffff',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="Male Initial">Male Initial</option>
                      <option value="Male Elite">Male Elite</option>
                      <option value="Female Initial">Female Initial</option>
                      <option value="Female Elite">Female Elite</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '0.75rem', 
                    fontWeight: 600, 
                    textTransform: 'uppercase', 
                    marginBottom: '0.5rem' 
                  }}>
                    Test Date
                  </label>
                  <input
                    type="date"
                    value={labTestDate}
                    onChange={(e) => setLabTestDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #000000',
                      fontFamily: 'inherit',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '0.75rem', 
                    fontWeight: 600, 
                    textTransform: 'uppercase', 
                    marginBottom: '0.5rem' 
                  }}>
                    Notes (Optional)
                  </label>
                  <textarea
                    value={labNotes}
                    onChange={(e) => setLabNotes(e.target.value)}
                    placeholder="Add notes about this lab result (e.g., 'Fasting', 'Follow-up test')"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #000000',
                      fontFamily: 'inherit',
                      fontSize: '0.9rem',
                      resize: 'vertical',
                      minHeight: '80px'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '0.75rem', 
                    fontWeight: 600, 
                    textTransform: 'uppercase', 
                    marginBottom: '0.5rem' 
                  }}>
                    Select PDF File
                  </label>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleLabUpload}
                    disabled={uploadingLab}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #000000',
                      fontFamily: 'inherit',
                      fontSize: '0.9rem',
                      cursor: uploadingLab ? 'not-allowed' : 'pointer'
                    }}
                  />
                </div>

                {uploadingLab && (
                  <div style={{ textAlign: 'center', color: '#666666', fontSize: '0.9rem' }}>
                    <Loader className="spin" size={16} style={{ display: 'inline-block', marginRight: '0.5rem' }} />
                    Uploading lab...
                  </div>
                )}
              </div>
            )}

            {/* COMPREHENSIVE LAB ENTRY MODAL */}
            {showLabResultEntry && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                padding: '2rem'
              }}>
                <div style={{
                  background: '#ffffff',
                  width: '100%',
                  maxWidth: '1200px',
                  maxHeight: '90vh',
                  overflow: 'auto',
                  border: '3px solid #000000',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
                }}>
                  {/* Modal Header */}
                  <div style={{
                    padding: '1.5rem',
                    borderBottom: '2px solid #000000',
                    background: '#000000',
                    color: '#ffffff',
                    position: 'sticky',
                    top: 0,
                    zIndex: 10
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, textTransform: 'uppercase' }}>
                        {editingLabResult ? 'Edit Lab Results' : 'Enter Lab Results'}
                      </h3>
                      <button
                        onClick={() => {
                          setShowLabResultEntry(false);
                          setEditingLabResult(null);
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#ffffff',
                          cursor: 'pointer',
                          fontSize: '1.5rem',
                          lineHeight: 1
                        }}
                      >
                        ×
                      </button>
                    </div>
                  </div>

                  {/* Modal Body */}
                  <div style={{ padding: '2rem' }}>
                    {/* Panel Selection and Metadata */}
                    <div style={{
                      background: '#fafafa',
                      border: '2px solid #000000',
                      padding: '1.5rem',
                      marginBottom: '2rem'
                    }}>
                      <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase' }}>
                        Lab Information
                      </h4>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#404040' }}>
                            Panel Type *
                          </label>
                          <select
                            value={labResultData.panel_type || ''}
                            onChange={(e) => setLabResultData({ ...labResultData, panel_type: e.target.value })}
                            style={{
                              width: '100%',
                              padding: '0.75rem 1rem',
                              border: '1.5px solid #d4d4d4',
                              fontSize: '1rem',
                              fontFamily: 'inherit',
                              background: '#ffffff'
                            }}
                            onFocus={(e) => {
                              e.target.style.borderColor = '#000000';
                              e.target.style.boxShadow = '0 0 0 3px rgba(0, 0, 0, 0.1)';
                            }}
                            onBlur={(e) => {
                              e.target.style.borderColor = '#d4d4d4';
                              e.target.style.boxShadow = 'none';
                            }}
                          >
                            <option value="Male Initial">Male Initial</option>
                            <option value="Male Elite">Male Elite</option>
                            <option value="Female Initial">Female Initial</option>
                            <option value="Female Elite">Female Elite</option>
                          </select>
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#404040' }}>
                            Lab Provider
                          </label>
                          <select
                            value={labResultData.lab_provider || 'Primex'}
                            onChange={(e) => setLabResultData({ ...labResultData, lab_provider: e.target.value })}
                            style={{
                              width: '100%',
                              padding: '0.75rem',
                              border: '2px solid #000000',
                              fontSize: '0.9rem',
                              fontFamily: 'inherit',
                              background: '#ffffff'
                            }}
                          >
                            <option value="Primex">Primex</option>
                            <option value="Access Med Labs">Access Med Labs</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#404040' }}>
                            Test Date *
                          </label>
                          <input
                            type="date"
                            value={labResultData.test_date || ''}
                            onChange={(e) => setLabResultData({ ...labResultData, test_date: e.target.value })}
                            style={{
                              width: '100%',
                              padding: '0.75rem',
                              border: '2px solid #000000',
                              fontSize: '0.9rem',
                              fontFamily: 'inherit'
                            }}
                          />
                        </div>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#404040' }}>
                          Notes
                        </label>
                        <textarea
                          value={labResultData.notes || ''}
                          onChange={(e) => setLabResultData({ ...labResultData, notes: e.target.value })}
                          placeholder="Add any notes about this lab test..."
                          rows={2}
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '2px solid #000000',
                            fontSize: '0.9rem',
                            fontFamily: 'inherit',
                            resize: 'vertical'
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '1.5rem', fontStyle: 'italic' }}>
                      💡 Enter only the values you have. Leave fields blank if not tested. Click section headers to expand/collapse.
                    </div>
                    {/* HORMONES SECTION */}
                    <div style={{ marginBottom: '1.5rem', border: '2px solid #000000' }}>
                      <div
                        onClick={() => toggleLabSection('hormones')}
                        style={{
                          padding: '1rem',
                          background: '#000000',
                          color: '#ffffff',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          textTransform: 'uppercase'
                        }}
                      >
                        <span>💪 HORMONES</span>
                        <span>{expandedLabSections['hormones'] ? '▼' : '▶'}</span>
                      </div>
                      {expandedLabSections['hormones'] && (
                        <div style={{ padding: '1.5rem', background: '#ffffff' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                            {/* Helper function for rendering biomarker input */}
                            {(() => {
                              const renderBiomarker = (name, label, unit) => {
                                const value = labResultData[name];
                                const status = value ? getValueStatus(name, value, selectedPatient?.gender || 'Male') : null;
                                
                                return (
                                  <div key={name}>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem', color: '#333' }}>
                                      {label} {unit && <span style={{ color: '#666', fontWeight: 400 }}>({unit})</span>}
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                      <input
                                        type="number"
                                        step="0.01"
                                        value={value || ''}
                                        onChange={(e) => setLabResultData({ ...labResultData, [name]: e.target.value })}
                                        style={{
                                          width: '100%',
                                          padding: '0.75rem',
                                          paddingRight: status ? '2.5rem' : '0.75rem',
                                          border: `2px solid ${status ? status.color : '#d4d4d4'}`,
                                          fontSize: '0.9rem',
                                          fontFamily: 'inherit',
                                          background: status ? status.bgColor : '#ffffff'
                                        }}
                                        placeholder="--"
                                      />
                                      {status && (
                                        <span style={{
                                          position: 'absolute',
                                          right: '0.75rem',
                                          top: '50%',
                                          transform: 'translateY(-50%)',
                                          fontSize: '1.25rem'
                                        }} title={status.label}>
                                          {status.icon}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              };

                              return (
                                <>
                                  {renderBiomarker('total_testosterone', 'Total Testosterone', 'ng/dL')}
                                  {renderBiomarker('free_testosterone', 'Free Testosterone', 'pg/mL')}
                                  {renderBiomarker('shbg', 'SHBG', 'nmol/L')}
                                  {renderBiomarker('estradiol', 'Estradiol', 'pg/mL')}
                                  {(labResultData.panel_type?.includes('Female') || selectedPatient?.gender === 'Female') && renderBiomarker('progesterone', 'Progesterone', 'ng/mL')}
                                  {labResultData.panel_type?.includes('Elite') && (
                                    <>
                                      {renderBiomarker('dhea_s', 'DHEA-S', 'μg/dL')}
                                      {renderBiomarker('fsh', 'FSH', 'mIU/mL')}
                                      {renderBiomarker('lh', 'LH', 'mIU/mL')}
                                      {renderBiomarker('igf_1', 'IGF-1', 'ng/mL')}
                                      {renderBiomarker('cortisol', 'Cortisol', 'μg/dL')}
                                      {labResultData.panel_type === 'Female Elite' && renderBiomarker('dht', 'DHT', 'ng/dL')}
                                    </>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* THYROID SECTION */}
                    <div style={{ marginBottom: '1.5rem', border: '2px solid #000000' }}>
                      <div
                        onClick={() => toggleLabSection('thyroid')}
                        style={{
                          padding: '1rem',
                          background: '#000000',
                          color: '#ffffff',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          textTransform: 'uppercase'
                        }}
                      >
                        <span>🦋 THYROID</span>
                        <span>{expandedLabSections['thyroid'] ? '▼' : '▶'}</span>
                      </div>
                      {expandedLabSections['thyroid'] && (
                        <div style={{ padding: '1.5rem', background: '#ffffff' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                            {(() => {
                              const renderBiomarker = (name, label, unit) => {
                                const value = labResultData[name];
                                const status = value ? getValueStatus(name, value, selectedPatient?.gender || 'Male') : null;
                                
                                return (
                                  <div key={name}>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem', color: '#333' }}>
                                      {label} {unit && <span style={{ color: '#666', fontWeight: 400 }}>({unit})</span>}
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                      <input
                                        type="number"
                                        step="0.01"
                                        value={value || ''}
                                        onChange={(e) => setLabResultData({ ...labResultData, [name]: e.target.value })}
                                        style={{
                                          width: '100%',
                                          padding: '0.75rem',
                                          paddingRight: status ? '2.5rem' : '0.75rem',
                                          border: `2px solid ${status ? status.color : '#d4d4d4'}`,
                                          fontSize: '0.9rem',
                                          fontFamily: 'inherit',
                                          background: status ? status.bgColor : '#ffffff'
                                        }}
                                        placeholder="--"
                                      />
                                      {status && (
                                        <span style={{
                                          position: 'absolute',
                                          right: '0.75rem',
                                          top: '50%',
                                          transform: 'translateY(-50%)',
                                          fontSize: '1.25rem'
                                        }} title={status.label}>
                                          {status.icon}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              };

                              return (
                                <>
                                  {renderBiomarker('tsh', 'TSH', 'uIU/mL')}
                                  {renderBiomarker('free_t3', 'Free T3', 'pg/mL')}
                                  {renderBiomarker('free_t4', 'Free T4', 'ng/dL')}
                                  {renderBiomarker('tpo_antibody', 'TPO Antibody', 'IU/mL')}
                                  {labResultData.panel_type?.includes('Elite') && renderBiomarker('thyroglobulin_antibody', 'Thyroglobulin Antibody', 'IU/mL')}
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* BLOOD SUGAR SECTION */}
                    <div style={{ marginBottom: '1.5rem', border: '2px solid #000000' }}>
                      <div
                        onClick={() => toggleLabSection('bloodsugar')}
                        style={{
                          padding: '1rem',
                          background: '#000000',
                          color: '#ffffff',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          textTransform: 'uppercase'
                        }}
                      >
                        <span>🍬 BLOOD SUGAR & METABOLISM</span>
                        <span>{expandedLabSections['bloodsugar'] ? '▼' : '▶'}</span>
                      </div>
                      {expandedLabSections['bloodsugar'] && (
                        <div style={{ padding: '1.5rem', background: '#ffffff' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                            {(() => {
                              const renderBiomarker = (name, label, unit) => {
                                const value = labResultData[name];
                                const status = value ? getValueStatus(name, value, selectedPatient?.gender || 'Male') : null;
                                
                                return (
                                  <div key={name}>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem', color: '#333' }}>
                                      {label} {unit && <span style={{ color: '#666', fontWeight: 400 }}>({unit})</span>}
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                      <input
                                        type="number"
                                        step="0.01"
                                        value={value || ''}
                                        onChange={(e) => setLabResultData({ ...labResultData, [name]: e.target.value })}
                                        style={{
                                          width: '100%',
                                          padding: '0.75rem',
                                          paddingRight: status ? '2.5rem' : '0.75rem',
                                          border: `2px solid ${status ? status.color : '#d4d4d4'}`,
                                          fontSize: '0.9rem',
                                          fontFamily: 'inherit',
                                          background: status ? status.bgColor : '#ffffff'
                                        }}
                                        placeholder="--"
                                      />
                                      {status && (
                                        <span style={{
                                          position: 'absolute',
                                          right: '0.75rem',
                                          top: '50%',
                                          transform: 'translateY(-50%)',
                                          fontSize: '1.25rem'
                                        }} title={status.label}>
                                          {status.icon}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              };

                              return (
                                <>
                                  {renderBiomarker('glucose', 'Glucose', 'mg/dL')}
                                  {renderBiomarker('fasting_insulin', 'Fasting Insulin', 'uIU/mL')}
                                  {renderBiomarker('hemoglobin_a1c', 'Hemoglobin A1C', '%')}
                                  {labResultData.panel_type?.includes('Elite') && renderBiomarker('uric_acid', 'Uric Acid', 'mg/dL')}
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* LIPIDS SECTION */}
                    <div style={{ marginBottom: '1.5rem', border: '2px solid #000000' }}>
                      <div
                        onClick={() => toggleLabSection('lipids')}
                        style={{
                          padding: '1rem',
                          background: '#000000',
                          color: '#ffffff',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          textTransform: 'uppercase'
                        }}
                      >
                        <span>❤️ LIPIDS & HEART HEALTH</span>
                        <span>{expandedLabSections['lipids'] ? '▼' : '▶'}</span>
                      </div>
                      {expandedLabSections['lipids'] && (
                        <div style={{ padding: '1.5rem', background: '#ffffff' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                            {(() => {
                              const renderBiomarker = (name, label, unit) => {
                                const value = labResultData[name];
                                const status = value ? getValueStatus(name, value, selectedPatient?.gender || 'Male') : null;
                                
                                return (
                                  <div key={name}>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem', color: '#333' }}>
                                      {label} {unit && <span style={{ color: '#666', fontWeight: 400 }}>({unit})</span>}
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                      <input
                                        type="number"
                                        step="0.01"
                                        value={value || ''}
                                        onChange={(e) => setLabResultData({ ...labResultData, [name]: e.target.value })}
                                        style={{
                                          width: '100%',
                                          padding: '0.75rem',
                                          paddingRight: status ? '2.5rem' : '0.75rem',
                                          border: `2px solid ${status ? status.color : '#d4d4d4'}`,
                                          fontSize: '0.9rem',
                                          fontFamily: 'inherit',
                                          background: status ? status.bgColor : '#ffffff'
                                        }}
                                        placeholder="--"
                                      />
                                      {status && (
                                        <span style={{
                                          position: 'absolute',
                                          right: '0.75rem',
                                          top: '50%',
                                          transform: 'translateY(-50%)',
                                          fontSize: '1.25rem'
                                        }} title={status.label}>
                                          {status.icon}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              };

                              return (
                                <>
                                  {renderBiomarker('total_cholesterol', 'Total Cholesterol', 'mg/dL')}
                                  {renderBiomarker('ldl_cholesterol', 'LDL Cholesterol', 'mg/dL')}
                                  {renderBiomarker('hdl_cholesterol', 'HDL Cholesterol', 'mg/dL')}
                                  {renderBiomarker('triglycerides', 'Triglycerides', 'mg/dL')}
                                  {renderBiomarker('vldl_cholesterol', 'VLDL Cholesterol', 'mg/dL')}
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* VITAMINS SECTION */}
                    <div style={{ marginBottom: '1.5rem', border: '2px solid #000000' }}>
                      <div
                        onClick={() => toggleLabSection('vitamins')}
                        style={{
                          padding: '1rem',
                          background: '#000000',
                          color: '#ffffff',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          textTransform: 'uppercase'
                        }}
                      >
                        <span>🌟 VITAMINS & MINERALS</span>
                        <span>{expandedLabSections['vitamins'] ? '▼' : '▶'}</span>
                      </div>
                      {expandedLabSections['vitamins'] && (
                        <div style={{ padding: '1.5rem', background: '#ffffff' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                            {(() => {
                              const renderBiomarker = (name, label, unit) => {
                                const value = labResultData[name];
                                const status = value ? getValueStatus(name, value, selectedPatient?.gender || 'Male') : null;
                                
                                return (
                                  <div key={name}>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem', color: '#333' }}>
                                      {label} {unit && <span style={{ color: '#666', fontWeight: 400 }}>({unit})</span>}
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                      <input
                                        type="number"
                                        step="0.01"
                                        value={value || ''}
                                        onChange={(e) => setLabResultData({ ...labResultData, [name]: e.target.value })}
                                        style={{
                                          width: '100%',
                                          padding: '0.75rem',
                                          paddingRight: status ? '2.5rem' : '0.75rem',
                                          border: `2px solid ${status ? status.color : '#d4d4d4'}`,
                                          fontSize: '0.9rem',
                                          fontFamily: 'inherit',
                                          background: status ? status.bgColor : '#ffffff'
                                        }}
                                        placeholder="--"
                                      />
                                      {status && (
                                        <span style={{
                                          position: 'absolute',
                                          right: '0.75rem',
                                          top: '50%',
                                          transform: 'translateY(-50%)',
                                          fontSize: '1.25rem'
                                        }} title={status.label}>
                                          {status.icon}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              };

                              return (
                                <>
                                  {renderBiomarker('vitamin_d', 'Vitamin D', 'ng/mL')}
                                  {labResultData.panel_type?.includes('Elite') && (
                                    <>
                                      {renderBiomarker('vitamin_b12', 'Vitamin B12', 'pg/mL')}
                                      {renderBiomarker('folate', 'Folate', 'ng/mL')}
                                      {renderBiomarker('magnesium', 'Magnesium', 'mg/dL')}
                                    </>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* INFLAMMATION SECTION (Elite only) */}
                    {labResultData.panel_type?.includes('Elite') && (
                      <div style={{ marginBottom: '1.5rem', border: '2px solid #000000' }}>
                        <div
                          onClick={() => toggleLabSection('inflammation')}
                          style={{
                            padding: '1rem',
                            background: '#000000',
                            color: '#ffffff',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontWeight: 700,
                            fontSize: '0.9rem',
                            textTransform: 'uppercase'
                          }}
                        >
                          <span>🔥 INFLAMMATION MARKERS</span>
                          <span>{expandedLabSections['inflammation'] ? '▼' : '▶'}</span>
                        </div>
                        {expandedLabSections['inflammation'] && (
                          <div style={{ padding: '1.5rem', background: '#ffffff' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                              {(() => {
                                const renderBiomarker = (name, label, unit) => {
                                  const value = labResultData[name];
                                  const status = value ? getValueStatus(name, value, selectedPatient?.gender || 'Male') : null;
                                  
                                  return (
                                    <div key={name}>
                                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem', color: '#333' }}>
                                        {label} {unit && <span style={{ color: '#666', fontWeight: 400 }}>({unit})</span>}
                                      </label>
                                      <div style={{ position: 'relative' }}>
                                        <input
                                          type="number"
                                          step="0.01"
                                          value={value || ''}
                                          onChange={(e) => setLabResultData({ ...labResultData, [name]: e.target.value })}
                                          style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            paddingRight: status ? '2.5rem' : '0.75rem',
                                            border: `2px solid ${status ? status.color : '#d4d4d4'}`,
                                            fontSize: '0.9rem',
                                            fontFamily: 'inherit',
                                            background: status ? status.bgColor : '#ffffff'
                                          }}
                                          placeholder="--"
                                        />
                                        {status && (
                                          <span style={{
                                            position: 'absolute',
                                            right: '0.75rem',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            fontSize: '1.25rem'
                                          }} title={status.label}>
                                            {status.icon}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                };

                                return (
                                  <>
                                    {renderBiomarker('crp_hs', 'CRP-HS', 'mg/L')}
                                    {renderBiomarker('esr', 'ESR', 'mm/hr')}
                                    {renderBiomarker('homocysteine', 'Homocysteine', 'μmol/L')}
                                  </>
                                );
                              })()}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* LIVER SECTION */}
                    <div style={{ marginBottom: '1.5rem', border: '2px solid #000000' }}>
                      <div
                        onClick={() => toggleLabSection('liver')}
                        style={{
                          padding: '1rem',
                          background: '#000000',
                          color: '#ffffff',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          textTransform: 'uppercase'
                        }}
                      >
                        <span>🫀 LIVER FUNCTION</span>
                        <span>{expandedLabSections['liver'] ? '▼' : '▶'}</span>
                      </div>
                      {expandedLabSections['liver'] && (
                        <div style={{ padding: '1.5rem', background: '#ffffff' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                            {(() => {
                              const renderBiomarker = (name, label, unit) => {
                                const value = labResultData[name];
                                const status = value ? getValueStatus(name, value, selectedPatient?.gender || 'Male') : null;
                                
                                return (
                                  <div key={name}>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem', color: '#333' }}>
                                      {label} {unit && <span style={{ color: '#666', fontWeight: 400 }}>({unit})</span>}
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                      <input
                                        type="number"
                                        step="0.01"
                                        value={value || ''}
                                        onChange={(e) => setLabResultData({ ...labResultData, [name]: e.target.value })}
                                        style={{
                                          width: '100%',
                                          padding: '0.75rem',
                                          paddingRight: status ? '2.5rem' : '0.75rem',
                                          border: `2px solid ${status ? status.color : '#d4d4d4'}`,
                                          fontSize: '0.9rem',
                                          fontFamily: 'inherit',
                                          background: status ? status.bgColor : '#ffffff'
                                        }}
                                        placeholder="--"
                                      />
                                      {status && (
                                        <span style={{
                                          position: 'absolute',
                                          right: '0.75rem',
                                          top: '50%',
                                          transform: 'translateY(-50%)',
                                          fontSize: '1.25rem'
                                        }} title={status.label}>
                                          {status.icon}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              };

                              return (
                                <>
                                  {renderBiomarker('alt', 'ALT', 'U/L')}
                                  {renderBiomarker('ast', 'AST', 'U/L')}
                                  {renderBiomarker('alkaline_phosphatase', 'Alkaline Phosphatase', 'U/L')}
                                  {renderBiomarker('total_bilirubin', 'Total Bilirubin', 'mg/dL')}
                                  {renderBiomarker('albumin', 'Albumin', 'g/dL')}
                                  {renderBiomarker('total_protein', 'Total Protein', 'g/dL')}
                                  {labResultData.panel_type?.includes('Elite') && renderBiomarker('ggt', 'GGT', 'U/L')}
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* KIDNEY SECTION */}
                    <div style={{ marginBottom: '1.5rem', border: '2px solid #000000' }}>
                      <div
                        onClick={() => toggleLabSection('kidney')}
                        style={{
                          padding: '1rem',
                          background: '#000000',
                          color: '#ffffff',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          textTransform: 'uppercase'
                        }}
                      >
                        <span>🫘 KIDNEY FUNCTION</span>
                        <span>{expandedLabSections['kidney'] ? '▼' : '▶'}</span>
                      </div>
                      {expandedLabSections['kidney'] && (
                        <div style={{ padding: '1.5rem', background: '#ffffff' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                            {(() => {
                              const renderBiomarker = (name, label, unit) => {
                                const value = labResultData[name];
                                const status = value ? getValueStatus(name, value, selectedPatient?.gender || 'Male') : null;
                                
                                return (
                                  <div key={name}>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem', color: '#333' }}>
                                      {label} {unit && <span style={{ color: '#666', fontWeight: 400 }}>({unit})</span>}
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                      <input
                                        type="number"
                                        step="0.01"
                                        value={value || ''}
                                        onChange={(e) => setLabResultData({ ...labResultData, [name]: e.target.value })}
                                        style={{
                                          width: '100%',
                                          padding: '0.75rem',
                                          paddingRight: status ? '2.5rem' : '0.75rem',
                                          border: `2px solid ${status ? status.color : '#d4d4d4'}`,
                                          fontSize: '0.9rem',
                                          fontFamily: 'inherit',
                                          background: status ? status.bgColor : '#ffffff'
                                        }}
                                        placeholder="--"
                                      />
                                      {status && (
                                        <span style={{
                                          position: 'absolute',
                                          right: '0.75rem',
                                          top: '50%',
                                          transform: 'translateY(-50%)',
                                          fontSize: '1.25rem'
                                        }} title={status.label}>
                                          {status.icon}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              };

                              return (
                                <>
                                  {renderBiomarker('creatinine', 'Creatinine', 'mg/dL')}
                                  {renderBiomarker('bun', 'BUN', 'mg/dL')}
                                  {renderBiomarker('egfr', 'eGFR', 'mL/min/1.73')}
                                  {renderBiomarker('bun_creatinine_ratio', 'BUN/Creatinine Ratio', '')}
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* ELECTROLYTES SECTION */}
                    <div style={{ marginBottom: '1.5rem', border: '2px solid #000000' }}>
                      <div
                        onClick={() => toggleLabSection('electrolytes')}
                        style={{
                          padding: '1rem',
                          background: '#000000',
                          color: '#ffffff',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          textTransform: 'uppercase'
                        }}
                      >
                        <span>⚡ ELECTROLYTES</span>
                        <span>{expandedLabSections['electrolytes'] ? '▼' : '▶'}</span>
                      </div>
                      {expandedLabSections['electrolytes'] && (
                        <div style={{ padding: '1.5rem', background: '#ffffff' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                            {(() => {
                              const renderBiomarker = (name, label, unit) => {
                                const value = labResultData[name];
                                
                                return (
                                  <div key={name}>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem', color: '#333' }}>
                                      {label} {unit && <span style={{ color: '#666', fontWeight: 400 }}>({unit})</span>}
                                    </label>
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={value || ''}
                                      onChange={(e) => setLabResultData({ ...labResultData, [name]: e.target.value })}
                                      style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        border: '2px solid #d4d4d4',
                                        fontSize: '0.9rem',
                                        fontFamily: 'inherit',
                                        background: '#ffffff'
                                      }}
                                      placeholder="--"
                                    />
                                  </div>
                                );
                              };

                              return (
                                <>
                                  {renderBiomarker('sodium', 'Sodium', 'mmol/L')}
                                  {renderBiomarker('potassium', 'Potassium', 'mmol/L')}
                                  {renderBiomarker('chloride', 'Chloride', 'mmol/L')}
                                  {renderBiomarker('co2', 'CO2', 'mmol/L')}
                                  {renderBiomarker('calcium', 'Calcium', 'mg/dL')}
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* CBC SECTION */}
                    <div style={{ marginBottom: '1.5rem', border: '2px solid #000000' }}>
                      <div
                        onClick={() => toggleLabSection('cbc')}
                        style={{
                          padding: '1rem',
                          background: '#000000',
                          color: '#ffffff',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          textTransform: 'uppercase'
                        }}
                      >
                        <span>🩸 COMPLETE BLOOD COUNT (CBC)</span>
                        <span>{expandedLabSections['cbc'] ? '▼' : '▶'}</span>
                      </div>
                      {expandedLabSections['cbc'] && (
                        <div style={{ padding: '1.5rem', background: '#ffffff' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                            {(() => {
                              const renderBiomarker = (name, label, unit) => {
                                const value = labResultData[name];
                                const status = value ? getValueStatus(name, value, selectedPatient?.gender || 'Male') : null;
                                
                                return (
                                  <div key={name}>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem', color: '#333' }}>
                                      {label} {unit && <span style={{ color: '#666', fontWeight: 400 }}>({unit})</span>}
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                      <input
                                        type="number"
                                        step="0.01"
                                        value={value || ''}
                                        onChange={(e) => setLabResultData({ ...labResultData, [name]: e.target.value })}
                                        style={{
                                          width: '100%',
                                          padding: '0.75rem',
                                          paddingRight: status ? '2.5rem' : '0.75rem',
                                          border: `2px solid ${status ? status.color : '#d4d4d4'}`,
                                          fontSize: '0.9rem',
                                          fontFamily: 'inherit',
                                          background: status ? status.bgColor : '#ffffff'
                                        }}
                                        placeholder="--"
                                      />
                                      {status && (
                                        <span style={{
                                          position: 'absolute',
                                          right: '0.75rem',
                                          top: '50%',
                                          transform: 'translateY(-50%)',
                                          fontSize: '1.25rem'
                                        }} title={status.label}>
                                          {status.icon}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              };

                              return (
                                <>
                                  {renderBiomarker('wbc', 'WBC', 'K/uL')}
                                  {renderBiomarker('rbc', 'RBC', 'M/uL')}
                                  {renderBiomarker('hemoglobin', 'Hemoglobin', 'g/dL')}
                                  {renderBiomarker('hematocrit', 'Hematocrit', '%')}
                                  {renderBiomarker('mcv', 'MCV', 'fL')}
                                  {renderBiomarker('mch', 'MCH', 'pg')}
                                  {renderBiomarker('mchc', 'MCHC', 'g/dL')}
                                  {renderBiomarker('rdw', 'RDW', '%')}
                                  {renderBiomarker('platelets', 'Platelets', 'K/uL')}
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* IRON SECTION (Elite only) */}
                    {labResultData.panel_type?.includes('Elite') && (
                      <div style={{ marginBottom: '1.5rem', border: '2px solid #000000' }}>
                        <div
                          onClick={() => toggleLabSection('iron')}
                          style={{
                            padding: '1rem',
                            background: '#000000',
                            color: '#ffffff',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontWeight: 700,
                            fontSize: '0.9rem',
                            textTransform: 'uppercase'
                          }}
                        >
                          <span>🔩 IRON STUDIES</span>
                          <span>{expandedLabSections['iron'] ? '▼' : '▶'}</span>
                        </div>
                        {expandedLabSections['iron'] && (
                          <div style={{ padding: '1.5rem', background: '#ffffff' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                              {(() => {
                                const renderBiomarker = (name, label, unit) => {
                                  const value = labResultData[name];
                                  
                                  return (
                                    <div key={name}>
                                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem', color: '#333' }}>
                                        {label} {unit && <span style={{ color: '#666', fontWeight: 400 }}>({unit})</span>}
                                      </label>
                                      <input
                                        type="number"
                                        step="0.01"
                                        value={value || ''}
                                        onChange={(e) => setLabResultData({ ...labResultData, [name]: e.target.value })}
                                        style={{
                                          width: '100%',
                                          padding: '0.75rem',
                                          border: '2px solid #d4d4d4',
                                          fontSize: '0.9rem',
                                          fontFamily: 'inherit',
                                          background: '#ffffff'
                                        }}
                                        placeholder="--"
                                      />
                                    </div>
                                  );
                                };

                                return (
                                  <>
                                    {renderBiomarker('iron', 'Iron', 'μg/dL')}
                                    {renderBiomarker('tibc', 'TIBC', 'μg/dL')}
                                    {renderBiomarker('iron_saturation', 'Iron Saturation', '%')}
                                    {renderBiomarker('ferritin', 'Ferritin', 'ng/mL')}
                                  </>
                                );
                              })()}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* PROSTATE SECTION (Male only) */}
                    {(labResultData.panel_type?.includes('Male') || selectedPatient?.gender === 'Male') && (
                      <div style={{ marginBottom: '1.5rem', border: '2px solid #000000' }}>
                        <div
                          onClick={() => toggleLabSection('prostate')}
                          style={{
                            padding: '1rem',
                            background: '#000000',
                            color: '#ffffff',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontWeight: 700,
                            fontSize: '0.9rem',
                            textTransform: 'uppercase'
                          }}
                        >
                          <span>🔬 PROSTATE HEALTH</span>
                          <span>{expandedLabSections['prostate'] ? '▼' : '▶'}</span>
                        </div>
                        {expandedLabSections['prostate'] && (
                          <div style={{ padding: '1.5rem', background: '#ffffff' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                              {(() => {
                                const renderBiomarker = (name, label, unit) => {
                                  const value = labResultData[name];
                                  const status = value ? getValueStatus(name, value, 'Male') : null;
                                  
                                  return (
                                    <div key={name}>
                                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem', color: '#333' }}>
                                        {label} {unit && <span style={{ color: '#666', fontWeight: 400 }}>({unit})</span>}
                                      </label>
                                      <div style={{ position: 'relative' }}>
                                        <input
                                          type="number"
                                          step="0.01"
                                          value={value || ''}
                                          onChange={(e) => setLabResultData({ ...labResultData, [name]: e.target.value })}
                                          style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            paddingRight: status ? '2.5rem' : '0.75rem',
                                            border: `2px solid ${status ? status.color : '#d4d4d4'}`,
                                            fontSize: '0.9rem',
                                            fontFamily: 'inherit',
                                            background: status ? status.bgColor : '#ffffff'
                                          }}
                                          placeholder="--"
                                        />
                                        {status && (
                                          <span style={{
                                            position: 'absolute',
                                            right: '0.75rem',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            fontSize: '1.25rem'
                                          }} title={status.label}>
                                            {status.icon}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                };

                                return (
                                  <>
                                    {renderBiomarker('psa_total', 'PSA Total', 'ng/mL')}
                                    {labResultData.panel_type?.includes('Elite') && renderBiomarker('psa_free', 'PSA Free', 'ng/mL')}
                                  </>
                                );
                              })()}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                  </div>

                  {/* Modal Footer with Save/Cancel */}
                  <div style={{
                    padding: '1.5rem',
                    borderTop: '2px solid #000000',
                    background: '#fafafa',
                    display: 'flex',
                    gap: '1rem',
                    justifyContent: 'flex-end',
                    position: 'sticky',
                    bottom: 0
                  }}>
                    <button
                      onClick={() => {
                        setShowLabResultEntry(false);
                        setEditingLabResult(null);
                      }}
                      className="btn"
                      style={{
                        background: '#ffffff',
                        border: '2px solid #000000',
                        color: '#000000',
                        padding: '0.75rem 1.5rem',
                        fontSize: '0.9rem',
                        fontWeight: 700,
                        textTransform: 'uppercase'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleLabResultSubmit}
                      className="btn btn-primary"
                      style={{
                        padding: '0.75rem 2rem',
                        fontSize: '0.9rem',
                        fontWeight: 700,
                        textTransform: 'uppercase'
                      }}
                    >
                      {editingLabResult ? 'Update Lab Results' : 'Save Lab Results'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {labs.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Timeline header */}
                <div style={{ 
                  fontSize: '0.85rem', 
                  color: '#666666', 
                  fontWeight: 600, 
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  borderBottom: '2px solid #e0e0e0',
                  paddingBottom: '0.5rem'
                }}>
                  Lab Timeline ({labs.length} results)
                </div>

                {labs.sort((a, b) => new Date(b.test_date) - new Date(a.test_date)).map((lab) => (
                  <div 
                    key={lab.id}
                    style={{ 
                      padding: '1rem',
                      border: selectedLabsForCompare.includes(lab.id) ? '3px solid #10b981' : '2px solid #e0e0e0',
                      background: selectedLabsForCompare.includes(lab.id) ? '#f0fdf4' : '#ffffff',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onClick={() => toggleLabForCompare(lab.id)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.75rem' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                          <div style={{ 
                            fontSize: '0.95rem', 
                            fontWeight: 700,
                            fontFamily: 'DM Sans'
                          }}>
                            {new Date(lab.test_date).toLocaleDateString('en-US')}
                          </div>
                          <div style={{ 
                            fontSize: '0.75rem', 
                            fontWeight: 700,
                            padding: '0.25rem 0.5rem',
                            background: lab.lab_provider === 'Primex' ? '#dbeafe' : '#fef3c7',
                            color: lab.lab_provider === 'Primex' ? '#1e40af' : '#92400e',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>
                            {lab.lab_provider}
                          </div>
                          <div style={{ 
                            fontSize: '0.8rem', 
                            fontWeight: 600,
                            color: '#666666'
                          }}>
                            {lab.test_type}
                          </div>
                        </div>
                        {lab.notes && (
                          <div style={{ fontSize: '0.85rem', color: '#666666', marginTop: '0.25rem' }}>
                            📝 {lab.notes}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {selectedLabsForCompare.includes(lab.id) && (
                          <div style={{ 
                            fontSize: '0.7rem', 
                            fontWeight: 700,
                            padding: '0.25rem 0.5rem',
                            background: '#10b981',
                            color: '#ffffff',
                            borderRadius: '4px'
                          }}>
                            SELECTED
                          </div>
                        )}
                        <a
                          href={lab.lab_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '0.5rem 0.75rem',
                            background: '#000000',
                            color: '#ffffff',
                            textDecoration: 'none',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}
                        >
                          <FileText size={12} style={{ marginRight: '0.25rem' }} />
                          View PDF
                        </a>
                      </div>
                    </div>
                    {selectedLabsForCompare.length < 2 && (
                      <div style={{ fontSize: '0.75rem', color: '#666666', fontStyle: 'italic' }}>
                        Click to {selectedLabsForCompare.includes(lab.id) ? 'deselect' : 'select'} for comparison
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ 
                padding: '2rem', 
                textAlign: 'center', 
                color: '#999999',
                fontSize: '0.9rem',
                fontStyle: 'italic'
              }}>
                No lab results uploaded yet.
              </div>
            )}
          </div>

          {/* Consent Forms Section */}
          {consentForms.length > 0 && (
            <div className="card" style={{ marginTop: '1.5rem' }}>
              <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.125rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', letterSpacing: '1px' }}>
                Consent Forms
              </h3>
              <div style={{ display: 'grid', gap: '1rem' }}>
                {consentForms.map((consent, index) => (
                  <div 
                    key={consent.id || index}
                    onClick={() => openConsentPanel(consent)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#fafafa';
                      e.currentTarget.style.transform = 'translateX(4px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#ffffff';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                    style={{ 
                      padding: '1.25rem', 
                      border: '2px solid #000000', 
                      background: '#ffffff',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '1rem', textTransform: 'uppercase' }}>
                          {consent.consent_type || 'Consent Form'}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#666666', marginTop: '0.25rem' }}>
                          Signed: {new Date(consent.submitted_at).toLocaleDateString('en-US')}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <div style={{ 
                          padding: '0.35rem 0.75rem', 
                          border: '2px solid #000000', 
                          fontSize: '0.7rem', 
                          fontWeight: 700, 
                          textTransform: 'uppercase',
                          background: '#000000',
                          color: '#ffffff'
                        }}>
                          ✓ SIGNED
                        </div>
                        <ChevronRight size={20} style={{ color: '#666666' }} />
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem', color: '#666666', flexWrap: 'wrap' }}>
                      {consent.date_of_birth && (
                        <span>DOB: {new Date(consent.date_of_birth).toLocaleDateString('en-US')}</span>
                      )}
                      {consent.consent_date && (
                        <span>Date: {new Date(consent.consent_date).toLocaleDateString('en-US')}</span>
                      )}
                    </div>

                    <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#666666', fontStyle: 'italic' }}>
                      Click to view full details →
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* Intake Side Panel */}
      {showIntakePanel && selectedIntake && (
        <>
          {/* Overlay */}
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              zIndex: 999,
              animation: 'fadeIn 0.3s ease'
            }}
            onClick={closeIntakePanel}
          />

          {/* Side Panel */}
          <div style={{
            position: 'fixed',
            top: 0,
            right: 0,
            bottom: 0,
            width: '600px',
            maxWidth: '90vw',
            background: '#ffffff',
            zIndex: 1000,
            boxShadow: '-4px 0 24px rgba(0, 0, 0, 0.15)',
            overflowY: 'auto',
            animation: 'slideInRight 0.3s ease',
            borderLeft: '4px solid #000000'
          }}>
            {/* Header */}
            <div style={{
              position: 'sticky',
              top: 0,
              background: '#000000',
              color: '#ffffff',
              padding: '1.5rem',
              borderBottom: '2px solid #000000',
              zIndex: 10
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Medical Intake Form
                  </h2>
                  <div style={{ fontSize: '0.9rem', opacity: 0.9, marginTop: '0.5rem' }}>
                    Submitted: {new Date(selectedIntake.submitted_at).toLocaleDateString('en-US')}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => handleDeleteIntake(selectedIntake.id)}
                    style={{
                      background: '#dc2626',
                      border: '2px solid #ffffff',
                      color: '#ffffff',
                      cursor: 'pointer',
                      padding: '0.5rem 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                  <button
                    onClick={closeIntakePanel}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#ffffff',
                      cursor: 'pointer',
                      padding: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div style={{ padding: '2rem' }}>
              {/* Personal Information */}
              <section style={{ marginBottom: '2rem' }}>
                <h3 style={{ 
                  margin: '0 0 1rem 0', 
                  fontSize: '1rem', 
                  fontWeight: 700, 
                  textTransform: 'uppercase', 
                  letterSpacing: '1px',
                  borderBottom: '2px solid #000000',
                  paddingBottom: '0.5rem'
                }}>
                  Personal Information
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#666666', textTransform: 'uppercase', fontWeight: 600 }}>Name</div>
                    <div style={{ fontFamily: 'DM Sans', fontWeight: 700, fontSize: '1rem' }}>
                      {selectedIntake.first_name} {selectedIntake.last_name}
                    </div>
                  </div>
                  {selectedIntake.date_of_birth && (
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#666666', textTransform: 'uppercase', fontWeight: 600 }}>Date of Birth</div>
                      <div style={{ fontFamily: 'DM Sans', fontWeight: 700, fontSize: '1rem' }}>
                        {new Date(selectedIntake.date_of_birth).toLocaleDateString('en-US')}
                      </div>
                    </div>
                  )}
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#666666', textTransform: 'uppercase', fontWeight: 600 }}>Email</div>
                    <div style={{ fontFamily: 'DM Sans', fontWeight: 700, fontSize: '0.9rem', wordBreak: 'break-word' }}>
                      {selectedIntake.email}
                    </div>
                  </div>
                  {selectedIntake.phone && (
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#666666', textTransform: 'uppercase', fontWeight: 600 }}>Phone</div>
                      <div style={{ fontFamily: 'DM Sans', fontWeight: 700, fontSize: '1rem' }}>
                        {selectedIntake.phone}
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* Health Concerns */}
              {selectedIntake.what_brings_you_in && (
                <section style={{ marginBottom: '2rem' }}>
                  <h3 style={{ 
                    margin: '0 0 1rem 0', 
                    fontSize: '1rem', 
                    fontWeight: 700, 
                    textTransform: 'uppercase', 
                    letterSpacing: '1px',
                    borderBottom: '2px solid #000000',
                    paddingBottom: '0.5rem'
                  }}>
                    Health Concerns & Symptoms
                  </h3>
                  <div style={{ padding: '1rem', background: '#fafafa', border: '1px solid #e0e0e0' }}>
                    <div style={{ fontSize: '0.75rem', color: '#666666', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.5rem' }}>
                      What Brings You In
                    </div>
                    <div style={{ fontSize: '0.95rem', lineHeight: '1.6' }}>{selectedIntake.what_brings_you_in}</div>
                  </div>
                </section>
              )}

              {/* Injury Information */}
              {selectedIntake.currently_injured && (
                <section style={{ marginBottom: '2rem' }}>
                  <h3 style={{ 
                    margin: '0 0 1rem 0', 
                    fontSize: '1rem', 
                    fontWeight: 700, 
                    textTransform: 'uppercase', 
                    letterSpacing: '1px',
                    borderBottom: '2px solid #000000',
                    paddingBottom: '0.5rem'
                  }}>
                    Current Injury
                  </h3>
                  <div style={{ padding: '1rem', background: '#fff5f5', border: '2px solid #fecaca' }}>
                    <div style={{ fontSize: '0.75rem', color: '#991b1b', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.75rem' }}>
                      ⚠️ ACTIVE INJURY
                    </div>
                    {selectedIntake.injury_description && (
                      <div style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                        <strong>Description:</strong> {selectedIntake.injury_description}
                      </div>
                    )}
                    {selectedIntake.injury_location && (
                      <div style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                        <strong>Location:</strong> {selectedIntake.injury_location}
                      </div>
                    )}
                    {selectedIntake.injury_when_occurred && (
                      <div style={{ fontSize: '0.9rem' }}>
                        <strong>When It Occurred:</strong> {selectedIntake.injury_when_occurred}
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Medical History */}
              <section style={{ marginBottom: '2rem' }}>
                <h3 style={{ 
                  margin: '0 0 1rem 0', 
                  fontSize: '1rem', 
                  fontWeight: 700, 
                  textTransform: 'uppercase', 
                  letterSpacing: '1px',
                  borderBottom: '2px solid #000000',
                  paddingBottom: '0.5rem'
                }}>
                  Medical History
                </h3>
                
                {/* Cardiovascular */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem', color: '#666666' }}>
                    Cardiovascular Conditions
                  </div>
                  <div style={{ display: 'grid', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: selectedIntake.high_blood_pressure ? '#fef3c7' : '#fafafa', border: '1px solid ' + (selectedIntake.high_blood_pressure ? '#fbbf24' : '#e0e0e0') }}>
                      <span style={{ fontSize: '0.9rem' }}>High Blood Pressure</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.125rem 0.5rem', background: selectedIntake.high_blood_pressure ? '#000' : '#e0e0e0', color: selectedIntake.high_blood_pressure ? '#fff' : '#666' }}>
                        {selectedIntake.high_blood_pressure ? 'YES' : 'NO'}
                        {selectedIntake.high_blood_pressure && selectedIntake.high_blood_pressure_year && ` (${selectedIntake.high_blood_pressure_year})`}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: selectedIntake.high_cholesterol ? '#fef3c7' : '#fafafa', border: '1px solid ' + (selectedIntake.high_cholesterol ? '#fbbf24' : '#e0e0e0') }}>
                      <span style={{ fontSize: '0.9rem' }}>High Cholesterol</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.125rem 0.5rem', background: selectedIntake.high_cholesterol ? '#000' : '#e0e0e0', color: selectedIntake.high_cholesterol ? '#fff' : '#666' }}>
                        {selectedIntake.high_cholesterol ? 'YES' : 'NO'}
                        {selectedIntake.high_cholesterol && selectedIntake.high_cholesterol_year && ` (${selectedIntake.high_cholesterol_year})`}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: selectedIntake.heart_disease ? '#fef3c7' : '#fafafa', border: '1px solid ' + (selectedIntake.heart_disease ? '#fbbf24' : '#e0e0e0') }}>
                      <span style={{ fontSize: '0.9rem' }}>Heart Disease</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.125rem 0.5rem', background: selectedIntake.heart_disease ? '#000' : '#e0e0e0', color: selectedIntake.heart_disease ? '#fff' : '#666' }}>
                        {selectedIntake.heart_disease ? 'YES' : 'NO'}
                        {selectedIntake.heart_disease && selectedIntake.heart_disease_type && ` - ${selectedIntake.heart_disease_type}`}
                        {selectedIntake.heart_disease && selectedIntake.heart_disease_year && ` (${selectedIntake.heart_disease_year})`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Metabolic & Endocrine */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem', color: '#666666' }}>
                    Metabolic & Endocrine Conditions
                  </div>
                  <div style={{ display: 'grid', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: selectedIntake.diabetes ? '#fef3c7' : '#fafafa', border: '1px solid ' + (selectedIntake.diabetes ? '#fbbf24' : '#e0e0e0') }}>
                      <span style={{ fontSize: '0.9rem' }}>Diabetes</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.125rem 0.5rem', background: selectedIntake.diabetes ? '#000' : '#e0e0e0', color: selectedIntake.diabetes ? '#fff' : '#666' }}>
                        {selectedIntake.diabetes ? 'YES' : 'NO'}
                        {selectedIntake.diabetes && selectedIntake.diabetes_type && ` - ${selectedIntake.diabetes_type}`}
                        {selectedIntake.diabetes && selectedIntake.diabetes_year && ` (${selectedIntake.diabetes_year})`}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: selectedIntake.thyroid_disorder ? '#fef3c7' : '#fafafa', border: '1px solid ' + (selectedIntake.thyroid_disorder ? '#fbbf24' : '#e0e0e0') }}>
                      <span style={{ fontSize: '0.9rem' }}>Thyroid Disorder</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.125rem 0.5rem', background: selectedIntake.thyroid_disorder ? '#000' : '#e0e0e0', color: selectedIntake.thyroid_disorder ? '#fff' : '#666' }}>
                        {selectedIntake.thyroid_disorder ? 'YES' : 'NO'}
                        {selectedIntake.thyroid_disorder && selectedIntake.thyroid_disorder_type && ` - ${selectedIntake.thyroid_disorder_type}`}
                        {selectedIntake.thyroid_disorder && selectedIntake.thyroid_disorder_year && ` (${selectedIntake.thyroid_disorder_year})`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Mental Health */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem', color: '#666666' }}>
                    Mental Health Conditions
                  </div>
                  <div style={{ display: 'grid', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: selectedIntake.depression_anxiety ? '#fef3c7' : '#fafafa', border: '1px solid ' + (selectedIntake.depression_anxiety ? '#fbbf24' : '#e0e0e0') }}>
                      <span style={{ fontSize: '0.9rem' }}>Depression / Anxiety</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.125rem 0.5rem', background: selectedIntake.depression_anxiety ? '#000' : '#e0e0e0', color: selectedIntake.depression_anxiety ? '#fff' : '#666' }}>
                        {selectedIntake.depression_anxiety ? 'YES' : 'NO'}
                        {selectedIntake.depression_anxiety && selectedIntake.depression_anxiety_year && ` (${selectedIntake.depression_anxiety_year})`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Organ Health */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem', color: '#666666' }}>
                    Organ Health Conditions
                  </div>
                  <div style={{ display: 'grid', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: selectedIntake.kidney_disease ? '#fef3c7' : '#fafafa', border: '1px solid ' + (selectedIntake.kidney_disease ? '#fbbf24' : '#e0e0e0') }}>
                      <span style={{ fontSize: '0.9rem' }}>Kidney Disease</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.125rem 0.5rem', background: selectedIntake.kidney_disease ? '#000' : '#e0e0e0', color: selectedIntake.kidney_disease ? '#fff' : '#666' }}>
                        {selectedIntake.kidney_disease ? 'YES' : 'NO'}
                        {selectedIntake.kidney_disease && selectedIntake.kidney_disease_type && ` - ${selectedIntake.kidney_disease_type}`}
                        {selectedIntake.kidney_disease && selectedIntake.kidney_disease_year && ` (${selectedIntake.kidney_disease_year})`}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: selectedIntake.liver_disease ? '#fef3c7' : '#fafafa', border: '1px solid ' + (selectedIntake.liver_disease ? '#fbbf24' : '#e0e0e0') }}>
                      <span style={{ fontSize: '0.9rem' }}>Liver Disease</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.125rem 0.5rem', background: selectedIntake.liver_disease ? '#000' : '#e0e0e0', color: selectedIntake.liver_disease ? '#fff' : '#666' }}>
                        {selectedIntake.liver_disease ? 'YES' : 'NO'}
                        {selectedIntake.liver_disease && selectedIntake.liver_disease_type && ` - ${selectedIntake.liver_disease_type}`}
                        {selectedIntake.liver_disease && selectedIntake.liver_disease_year && ` (${selectedIntake.liver_disease_year})`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Immune System & Cancer */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem', color: '#666666' }}>
                    Immune System & Cancer
                  </div>
                  <div style={{ display: 'grid', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: selectedIntake.autoimmune_disorder ? '#fef3c7' : '#fafafa', border: '1px solid ' + (selectedIntake.autoimmune_disorder ? '#fbbf24' : '#e0e0e0') }}>
                      <span style={{ fontSize: '0.9rem' }}>Autoimmune Disorder</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.125rem 0.5rem', background: selectedIntake.autoimmune_disorder ? '#000' : '#e0e0e0', color: selectedIntake.autoimmune_disorder ? '#fff' : '#666' }}>
                        {selectedIntake.autoimmune_disorder ? 'YES' : 'NO'}
                        {selectedIntake.autoimmune_disorder && selectedIntake.autoimmune_disorder_type && ` - ${selectedIntake.autoimmune_disorder_type}`}
                        {selectedIntake.autoimmune_disorder && selectedIntake.autoimmune_disorder_year && ` (${selectedIntake.autoimmune_disorder_year})`}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: selectedIntake.cancer ? '#fef3c7' : '#fafafa', border: '1px solid ' + (selectedIntake.cancer ? '#fbbf24' : '#e0e0e0') }}>
                      <span style={{ fontSize: '0.9rem' }}>Cancer</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.125rem 0.5rem', background: selectedIntake.cancer ? '#000' : '#e0e0e0', color: selectedIntake.cancer ? '#fff' : '#666' }}>
                        {selectedIntake.cancer ? 'YES' : 'NO'}
                        {selectedIntake.cancer && selectedIntake.cancer_type && ` - ${selectedIntake.cancer_type}`}
                        {selectedIntake.cancer && selectedIntake.cancer_year && ` (${selectedIntake.cancer_year})`}
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Medications & Allergies */}
              <section style={{ marginBottom: '2rem' }}>
                <h3 style={{ 
                  margin: '0 0 1rem 0', 
                  fontSize: '1rem', 
                  fontWeight: 700, 
                  textTransform: 'uppercase', 
                  letterSpacing: '1px',
                  borderBottom: '2px solid #000000',
                  paddingBottom: '0.5rem'
                }}>
                  Medications & Allergies
                </h3>
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: selectedIntake.on_hrt ? '#dbeafe' : '#fafafa', border: '1px solid ' + (selectedIntake.on_hrt ? '#3b82f6' : '#e0e0e0') }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>On HRT</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.125rem 0.5rem', background: selectedIntake.on_hrt ? '#3b82f6' : '#e0e0e0', color: selectedIntake.on_hrt ? '#fff' : '#666' }}>
                      {selectedIntake.on_hrt ? 'YES' : 'NO'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: selectedIntake.on_other_medications ? '#dbeafe' : '#fafafa', border: '1px solid ' + (selectedIntake.on_other_medications ? '#3b82f6' : '#e0e0e0') }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>On Other Medications</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.125rem 0.5rem', background: selectedIntake.on_other_medications ? '#3b82f6' : '#e0e0e0', color: selectedIntake.on_other_medications ? '#fff' : '#666' }}>
                      {selectedIntake.on_other_medications ? 'YES' : 'NO'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: selectedIntake.has_allergies ? '#fff5f5' : '#fafafa', border: '1px solid ' + (selectedIntake.has_allergies ? '#fecaca' : '#e0e0e0') }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Has Allergies</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.125rem 0.5rem', background: selectedIntake.has_allergies ? '#dc2626' : '#e0e0e0', color: selectedIntake.has_allergies ? '#fff' : '#666' }}>
                      {selectedIntake.has_allergies ? 'YES' : 'NO'}
                    </span>
                  </div>
                  {selectedIntake.has_allergies && selectedIntake.allergies && (
                    <div style={{ padding: '1rem', background: '#fff5f5', border: '2px solid #fecaca', borderTop: 'none' }}>
                      <div style={{ fontSize: '0.75rem', color: '#991b1b', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.5rem' }}>
                        ⚠️ ALLERGY DETAILS
                      </div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#991b1b' }}>
                        {selectedIntake.allergies}
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* Documents */}
              {selectedIntake.pdf_url && (
                <section style={{ marginBottom: '2rem' }}>
                  <h3 style={{ 
                    margin: '0 0 1rem 0', 
                    fontSize: '1rem', 
                    fontWeight: 700, 
                    textTransform: 'uppercase', 
                    letterSpacing: '1px',
                    borderBottom: '2px solid #000000',
                    paddingBottom: '0.5rem'
                  }}>
                    Documents
                  </h3>
                  <a 
                    href={selectedIntake.pdf_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn btn-primary"
                    style={{ fontSize: '0.875rem', padding: '0.75rem 1rem' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <FileText size={16} />
                    Download Original PDF
                  </a>
                </section>
              )}

              {/* Consent */}
              {selectedIntake.consent_given && (
                <section>
                  <div style={{ padding: '1rem', background: '#f0fdf4', border: '1px solid #86efac', fontSize: '0.85rem', color: '#166534' }}>
                    ✓ Patient consent obtained electronically on {new Date(selectedIntake.submitted_at).toLocaleDateString('en-US')}
                  </div>
                </section>
              )}
            </div>
          </div>
        </>
      )}

      {/* Consent Side Panel */}
      {showConsentPanel && selectedConsent && (
        <>
          {/* Overlay */}
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              zIndex: 999,
              animation: 'fadeIn 0.3s ease'
            }}
            onClick={closeConsentPanel}
          />

          {/* Side Panel */}
          <div style={{
            position: 'fixed',
            top: 0,
            right: 0,
            bottom: 0,
            width: '600px',
            maxWidth: '90vw',
            background: '#ffffff',
            zIndex: 1000,
            boxShadow: '-4px 0 24px rgba(0, 0, 0, 0.15)',
            overflowY: 'auto',
            animation: 'slideInRight 0.3s ease',
            borderLeft: '4px solid #000000'
          }}>
            {/* Header */}
            <div style={{
              position: 'sticky',
              top: 0,
              background: '#000000',
              color: '#ffffff',
              padding: '1.5rem',
              borderBottom: '2px solid #000000',
              zIndex: 10
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                    {selectedConsent.consent_type || 'Consent Form'}
                  </h2>
                  <div style={{ fontSize: '0.9rem', opacity: 0.9, marginTop: '0.5rem' }}>
                    Signed: {new Date(selectedConsent.submitted_at).toLocaleDateString('en-US')}
                  </div>
                </div>
                <button
                  onClick={closeConsentPanel}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#ffffff',
                    cursor: 'pointer',
                    padding: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div style={{ padding: '2rem' }}>
              {/* Patient Information */}
              <section style={{ marginBottom: '2rem' }}>
                <h3 style={{ 
                  margin: '0 0 1rem 0', 
                  fontSize: '1rem', 
                  fontWeight: 700, 
                  textTransform: 'uppercase', 
                  letterSpacing: '1px',
                  borderBottom: '2px solid #000000',
                  paddingBottom: '0.5rem'
                }}>
                  Patient Information
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#666666', textTransform: 'uppercase', fontWeight: 600 }}>Name</div>
                    <div style={{ fontFamily: 'DM Sans', fontWeight: 700, fontSize: '1rem' }}>
                      {selectedConsent.first_name} {selectedConsent.last_name}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#666666', textTransform: 'uppercase', fontWeight: 600 }}>Date of Birth</div>
                    <div style={{ fontFamily: 'DM Sans', fontWeight: 700, fontSize: '1rem' }}>
                      {new Date(selectedConsent.date_of_birth).toLocaleDateString('en-US')}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#666666', textTransform: 'uppercase', fontWeight: 600 }}>Email</div>
                    <div style={{ fontFamily: 'DM Sans', fontWeight: 700, fontSize: '0.9rem', wordBreak: 'break-word' }}>
                      {selectedConsent.email}
                    </div>
                  </div>
                  {selectedConsent.phone && (
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#666666', textTransform: 'uppercase', fontWeight: 600 }}>Phone</div>
                      <div style={{ fontFamily: 'DM Sans', fontWeight: 700, fontSize: '1rem' }}>
                        {selectedConsent.phone}
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* Consent Details */}
              <section style={{ marginBottom: '2rem' }}>
                <h3 style={{ 
                  margin: '0 0 1rem 0', 
                  fontSize: '1rem', 
                  fontWeight: 700, 
                  textTransform: 'uppercase', 
                  letterSpacing: '1px',
                  borderBottom: '2px solid #000000',
                  paddingBottom: '0.5rem'
                }}>
                  Consent Details
                </h3>
                
                <div style={{ padding: '1rem', background: '#f0fdf4', border: '2px solid #86efac', marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', color: '#166534', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.5rem' }}>
                    ✓ Consent Status
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#166534' }}>
                    Patient consent obtained electronically
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#666666', textTransform: 'uppercase', fontWeight: 600 }}>Consent Type</div>
                    <div style={{ fontFamily: 'DM Sans', fontWeight: 700, fontSize: '1rem' }}>
                      {selectedConsent.consent_type || 'Blood Draw'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#666666', textTransform: 'uppercase', fontWeight: 600 }}>Consent Date</div>
                    <div style={{ fontFamily: 'DM Sans', fontWeight: 700, fontSize: '1rem' }}>
                      {new Date(selectedConsent.consent_date).toLocaleDateString('en-US')}
                    </div>
                  </div>
                </div>
              </section>

              {/* Signature */}
              <section style={{ marginBottom: '2rem' }}>
                <h3 style={{ 
                  margin: '0 0 1rem 0', 
                  fontSize: '1rem', 
                  fontWeight: 700, 
                  textTransform: 'uppercase', 
                  letterSpacing: '1px',
                  borderBottom: '2px solid #000000',
                  paddingBottom: '0.5rem'
                }}>
                  Digital Signature
                </h3>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  {selectedConsent.signature_url && (
                    <a 
                      href={selectedConsent.signature_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn"
                      style={{ fontSize: '0.875rem', padding: '0.75rem 1rem' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <FileText size={16} />
                      View Signature
                    </a>
                  )}
                </div>
              </section>

              {/* Submission Info */}
              <section>
                <div style={{ padding: '1rem', background: '#fafafa', border: '1px solid #e0e0e0', fontSize: '0.85rem', color: '#666666' }}>
                  <strong>Submitted:</strong> {new Date(selectedConsent.submitted_at).toLocaleDateString('en-US')} at {new Date(selectedConsent.submitted_at).toLocaleTimeString()}
                </div>
              </section>
            </div>
          </div>
        </>
      )}

      {/* Add Patient Modal */}
      {showAddPatientModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: '#ffffff',
            border: '3px solid #000000',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            padding: '2rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
                Add New Patient
              </h2>
              <button 
                onClick={() => setShowAddPatientModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' }}
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={(e) => handleAddPatient(e, false)}>
              {/* Name */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  value={newPatient.name}
                  onChange={(e) => setNewPatient({...newPatient, name: e.target.value})}
                  placeholder="John Smith"
                  required
                  style={{
                    width: '100%',
                    padding: '0.65rem',
                    border: '2px solid #000000',
                    fontFamily: 'Inter',
                    fontSize: '0.9rem'
                  }}
                />
              </div>

              {/* Email */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Email
                </label>
                <input
                  type="email"
                  value={newPatient.email}
                  onChange={(e) => setNewPatient({...newPatient, email: e.target.value})}
                  placeholder="john@example.com"
                  style={{
                    width: '100%',
                    padding: '0.65rem',
                    border: '2px solid #000000',
                    fontFamily: 'Inter',
                    fontSize: '0.9rem'
                  }}
                />
              </div>

              {/* Phone */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Phone
                </label>
                <input
                  type="tel"
                  value={newPatient.phone}
                  onChange={(e) => setNewPatient({...newPatient, phone: e.target.value})}
                  placeholder="(949) 555-1234"
                  style={{
                    width: '100%',
                    padding: '0.65rem',
                    border: '2px solid #000000',
                    fontFamily: 'Inter',
                    fontSize: '0.9rem'
                  }}
                />
              </div>

              {/* Date of Birth */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={newPatient.date_of_birth}
                  onChange={(e) => setNewPatient({...newPatient, date_of_birth: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.65rem',
                    border: '2px solid #000000',
                    fontFamily: 'Inter',
                    fontSize: '0.9rem'
                  }}
                />
              </div>

              {/* Address */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Street Address
                </label>
                <input
                  type="text"
                  value={newPatient.address || ''}
                  onChange={(e) => setNewPatient({...newPatient, address: e.target.value})}
                  placeholder="123 Main Street"
                  style={{
                    width: '100%',
                    padding: '0.65rem',
                    border: '2px solid #000000',
                    fontFamily: 'Inter',
                    fontSize: '0.9rem'
                  }}
                />
              </div>

              {/* City, State, Zip */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    City
                  </label>
                  <input
                    type="text"
                    value={newPatient.city || ''}
                    onChange={(e) => setNewPatient({...newPatient, city: e.target.value})}
                    placeholder="Costa Mesa"
                    style={{
                      width: '100%',
                      padding: '0.65rem',
                      border: '2px solid #000000',
                      fontFamily: 'Inter',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    State
                  </label>
                  <input
                    type="text"
                    value={newPatient.state || ''}
                    onChange={(e) => setNewPatient({...newPatient, state: e.target.value})}
                    placeholder="CA"
                    maxLength="2"
                    style={{
                      width: '100%',
                      padding: '0.65rem',
                      border: '2px solid #000000',
                      fontFamily: 'Inter',
                      fontSize: '0.9rem',
                      textTransform: 'uppercase'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Zip
                  </label>
                  <input
                    type="text"
                    value={newPatient.zip_code || ''}
                    onChange={(e) => setNewPatient({...newPatient, zip_code: e.target.value})}
                    placeholder="92627"
                    maxLength="10"
                    style={{
                      width: '100%',
                      padding: '0.65rem',
                      border: '2px solid #000000',
                      fontFamily: 'Inter',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>
              </div>

              {/* Info Note */}
              <div style={{ 
                marginBottom: '1.5rem', 
                padding: '0.75rem', 
                background: '#f5f5f5', 
                border: '1px solid #e0e0e0',
                fontSize: '0.85rem',
                color: '#666666'
              }}>
                * Name is required. Must provide at least Email OR Phone.
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowAddPatientModal(false)}
                  className="btn"
                  disabled={addingPatient}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={addingPatient}
                >
                  {addingPatient ? 'Adding...' : 'Add Patient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Protocol Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: '#ffffff',
            border: '3px solid #000000',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            padding: '2rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
                {isEditMode ? 'Edit Protocol' : 'Add New Protocol'}
              </h2>
              <button 
                onClick={closeModal}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' }}
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={isEditMode ? handleUpdateProtocol : handleAddProtocol}>
              {/* Patient Selection */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Patient *
                </label>
                <select
                  value={newProtocol.patient_id}
                  onChange={(e) => {
                    if (e.target.value === 'ADD_NEW') {
                      setShowQuickAddPatient(true);
                    } else {
                      setNewProtocol({...newProtocol, patient_id: e.target.value});
                    }
                  }}
                  required
                  style={{
                    width: '100%',
                    padding: '0.65rem',
                    border: '2px solid #000000',
                    fontFamily: 'Inter',
                    fontSize: '0.9rem'
                  }}
                >
                  <option value="">Select a patient...</option>
                  <option value="ADD_NEW" style={{ fontWeight: 700, background: '#f5f5f5' }}>+ Add New Patient...</option>
                  <option disabled>──────────</option>
                  {patients.sort((a, b) => a.name.localeCompare(b.name)).map(patient => (
                    <option key={patient.id} value={patient.id}>
                      {patient.name} ({patient.email || patient.phone})
                    </option>
                  ))}
                </select>
              </div>

              {/* Quick Add Patient Form */}
              {showQuickAddPatient && (
                <div style={{ 
                  marginBottom: '1.5rem', 
                  padding: '1.5rem', 
                  border: '2px solid #000000', 
                  background: '#fafafa' 
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      Quick Add Patient
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowQuickAddPatient(false)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' }}
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div style={{ display: 'grid', gap: '1rem' }}>
                    {/* Name */}
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>
                        Name *
                      </label>
                      <input
                        type="text"
                        value={newPatient.name}
                        onChange={(e) => setNewPatient({...newPatient, name: e.target.value})}
                        placeholder="John Smith"
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          border: '2px solid #000000',
                          fontFamily: 'Inter',
                          fontSize: '0.85rem'
                        }}
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>
                        Email
                      </label>
                      <input
                        type="email"
                        value={newPatient.email}
                        onChange={(e) => setNewPatient({...newPatient, email: e.target.value})}
                        placeholder="john@example.com"
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          border: '2px solid #000000',
                          fontFamily: 'Inter',
                          fontSize: '0.85rem'
                        }}
                      />
                    </div>

                    {/* Phone */}
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={newPatient.phone}
                        onChange={(e) => setNewPatient({...newPatient, phone: e.target.value})}
                        placeholder="(949) 555-1234"
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          border: '2px solid #000000',
                          fontFamily: 'Inter',
                          fontSize: '0.85rem'
                        }}
                      />
                    </div>

                    <div style={{ fontSize: '0.75rem', color: '#666666', fontStyle: 'italic' }}>
                      Must provide at least email OR phone
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleAddPatient(e, true)}
                      className="btn btn-primary"
                      disabled={addingPatient}
                      style={{ width: '100%' }}
                    >
                      {addingPatient ? 'Adding Patient...' : 'Add Patient & Select'}
                    </button>
                  </div>
                </div>
              )}

              {/* Protocol Type */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Protocol Type *
                </label>
                <select
                  value={newProtocol.type}
                  onChange={(e) => setNewProtocol({...newProtocol, type: e.target.value})}
                  required
                  style={{
                    width: '100%',
                    padding: '0.65rem',
                    border: '2px solid #000000',
                    fontFamily: 'Inter',
                    fontSize: '0.9rem'
                  }}
                >
                  <option value="peptide">Peptide</option>
                  <option value="hrt">HRT</option>
                  <option value="weightloss">Weight Loss</option>
                  <option value="iv">IV Therapy</option>
                  <option value="hbot">HBOT</option>
                  <option value="rlt">Red Light Therapy</option>
                </select>
              </div>

              {/* Protocol Name */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Protocol Name *
                </label>
                <input
                  type="text"
                  value={newProtocol.name}
                  onChange={(e) => setNewProtocol({...newProtocol, name: e.target.value})}
                  placeholder="e.g., BPC-157 + TB-500"
                  required
                  style={{
                    width: '100%',
                    padding: '0.65rem',
                    border: '2px solid #000000',
                    fontFamily: 'Inter',
                    fontSize: '0.9rem'
                  }}
                />
              </div>

              {/* Two Column Layout */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                {/* Start Date */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={newProtocol.start_date}
                    onChange={(e) => setNewProtocol({...newProtocol, start_date: e.target.value})}
                    required
                    style={{
                      width: '100%',
                      padding: '0.65rem',
                      border: '2px solid #000000',
                      fontFamily: 'Inter',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>

                {/* Duration */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Duration (days)
                  </label>
                  <input
                    type="number"
                    value={newProtocol.duration}
                    onChange={(e) => setNewProtocol({...newProtocol, duration: e.target.value})}
                    placeholder="10, 30, etc."
                    style={{
                      width: '100%',
                      padding: '0.65rem',
                      border: '2px solid #000000',
                      fontFamily: 'Inter',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>
              </div>

              {/* Price and Status */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                {/* Price */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Price * ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newProtocol.price}
                    onChange={(e) => setNewProtocol({...newProtocol, price: e.target.value})}
                    placeholder="250.00"
                    required
                    style={{
                      width: '100%',
                      padding: '0.65rem',
                      border: '2px solid #000000',
                      fontFamily: 'Inter',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>

                {/* Status */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Status *
                  </label>
                  <select
                    value={newProtocol.status}
                    onChange={(e) => setNewProtocol({...newProtocol, status: e.target.value})}
                    required
                    style={{
                      width: '100%',
                      padding: '0.65rem',
                      border: '2px solid #000000',
                      fontFamily: 'Inter',
                      fontSize: '0.9rem'
                    }}
                  >
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="paused">Paused</option>
                  </select>
                </div>
              </div>

              {/* Conditional Fields Based on Type */}
              {(newProtocol.type === 'peptide' || newProtocol.type === 'hrt' || newProtocol.type === 'weightloss') && (
                <>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Dosing
                    </label>
                    <input
                      type="text"
                      value={newProtocol.dosing}
                      onChange={(e) => setNewProtocol({...newProtocol, dosing: e.target.value})}
                      placeholder="e.g., 100mg weekly, 5mg daily"
                      style={{
                        width: '100%',
                        padding: '0.65rem',
                        border: '2px solid #000000',
                        fontFamily: 'Inter',
                        fontSize: '0.9rem'
                      }}
                    />
                  </div>

                  {newProtocol.type === 'peptide' && (
                    <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Injection Schedule
                      </label>
                      <select
                        value={newProtocol.injection_schedule}
                        onChange={(e) => setNewProtocol({...newProtocol, injection_schedule: e.target.value})}
                        style={{
                          width: '100%',
                          padding: '0.65rem',
                          border: '2px solid #000000',
                          fontFamily: 'Inter',
                          fontSize: '0.9rem'
                        }}
                      >
                        <option value="">Select schedule...</option>
                        <option value="Daily">Daily</option>
                        <option value="Every other day">Every other day</option>
                        <option value="Twice weekly">Twice weekly</option>
                        <option value="Weekly">Weekly</option>
                      </select>
                    </div>
                  )}
                </>
              )}

              {/* Next Lab Date for HRT */}
              {newProtocol.type === 'hrt' && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Next Lab Date
                  </label>
                  <input
                    type="date"
                    value={newProtocol.next_lab_date}
                    onChange={(e) => setNewProtocol({...newProtocol, next_lab_date: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '0.65rem',
                      border: '2px solid #000000',
                      fontFamily: 'Inter',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>
              )}

              {/* Notes */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Notes
                </label>
                <textarea
                  value={newProtocol.notes}
                  onChange={(e) => setNewProtocol({...newProtocol, notes: e.target.value})}
                  placeholder="Any additional notes..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.65rem',
                    border: '2px solid #000000',
                    fontFamily: 'Inter',
                    fontSize: '0.9rem',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? (isEditMode ? 'Updating...' : 'Adding...') : (isEditMode ? 'Update Protocol' : 'Add Protocol')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Show dashboard only when no patient is selected */}
      {!selectedPatient && (
        <>
      {/* Header */}
      <div style={{ marginBottom: '2rem', borderBottom: '3px solid #000000', paddingBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
              RANGE MEDICAL
            </h1>
            <p style={{ margin: '0.25rem 0 0 0', color: '#666666', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 600 }}>
              Treatment Protocol Management System
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <button className="btn" onClick={() => setActiveView('alerts')}>
                <Bell size={16} />
                Alerts
                {alerts.length > 0 && (
                  <span style={{ 
                    position: 'absolute', 
                    top: '-8px', 
                    right: '-8px', 
                    background: '#000000', 
                    color: '#ffffff', 
                    borderRadius: '50%', 
                    width: '24px', 
                    height: '24px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontSize: '0.7rem',
                    fontWeight: 700
                  }}>
                    {alerts.length}
                  </span>
                )}
              </button>
            </div>
            <button className="btn" onClick={() => setShowAddPatientModal(true)}>
              <Plus size={16} />
              Add Patient
            </button>
            <label className="btn" style={{ cursor: 'pointer', margin: 0 }}>
              <input
                type="file"
                accept=".csv"
                onChange={handleCSVImport}
                style={{ display: 'none' }}
                disabled={importing}
              />
              <FileText size={16} />
              {importing ? 'Importing...' : 'Import CSV'}
            </label>
            <label className="btn" style={{ cursor: 'pointer', margin: 0, background: '#10b981', color: 'white', border: '2px solid #10b981' }}>
              <input
                type="file"
                accept=".pdf"
                onChange={handleIntakePDFImport}
                style={{ display: 'none' }}
                disabled={importingPDF}
              />
              <FileText size={16} />
              {importingPDF ? 'Processing...' : 'Upload Intake PDF'}
            </label>
            <button className="btn btn-primary" onClick={() => {
              setIsEditMode(false);
              setEditingProtocolId(null);
              setNewProtocol({
                patient_id: '',
                type: 'peptide',
                name: '',
                start_date: new Date().toISOString().split('T')[0], // Always TODAY!
                duration: '',
                status: 'active',
                price: '',
                dosing: '',
                injection_schedule: '',
                next_lab_date: '',
                notes: ''
              });
              setShowAddModal(true);
            }}>
              <Plus size={16} />
              Add Protocol
            </button>
          </div>
        </div>
      </div>

      {/* Simple dashboard with metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <div className="card">
          <div style={{ fontSize: '0.7rem', color: '#666666', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, marginBottom: '0.5rem' }}>
            Total Active Protocols
          </div>
          <div style={{ fontFamily: 'DM Sans', fontSize: '2rem', fontWeight: 700 }}>{protocolStats.total}</div>
        </div>
        
        <div className="card">
          <div style={{ fontSize: '0.7rem', color: '#666666', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, marginBottom: '0.5rem' }}>
            Active Patients
          </div>
          <div style={{ fontFamily: 'DM Sans', fontSize: '2rem', fontWeight: 700 }}>{patients.length}</div>
        </div>
        
        <div className="card">
          <div style={{ fontSize: '0.7rem', color: '#666666', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, marginBottom: '0.5rem' }}>
            Pending Alerts
          </div>
          <div style={{ fontFamily: 'DM Sans', fontSize: '2rem', fontWeight: 700 }}>{alerts.length}</div>
        </div>
        
        <div className="card">
          <div style={{ fontSize: '0.7rem', color: '#666666', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, marginBottom: '0.5rem' }}>
            Total Revenue
          </div>
          <div style={{ fontFamily: 'DM Sans', fontSize: '2rem', fontWeight: 700 }}>${revenueData.total.toLocaleString()}</div>
        </div>
      </div>

      {/* Patient list */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
          <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
            Patients ({filteredPatients.length})
          </h3>
          
          {/* Search Bar */}
          <div style={{ position: 'relative', flex: '1', maxWidth: '400px', minWidth: '250px' }}>
            <Search 
              size={18} 
              style={{ 
                position: 'absolute', 
                left: '12px', 
                top: '50%', 
                transform: 'translateY(-50%)', 
                color: '#666666' 
              }} 
            />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 0.65rem 0.65rem 2.5rem',
                border: '2px solid #000000',
                fontFamily: 'Inter',
                fontSize: '0.85rem',
                outline: 'none'
              }}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {filteredPatients.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#666666' }}>
            {searchTerm ? (
              <>
                <div style={{ marginBottom: '0.5rem' }}>No patients found matching "{searchTerm}"</div>
                <div style={{ fontSize: '0.85rem' }}>Try a different search term</div>
              </>
            ) : (
              <>
                <div style={{ marginBottom: '0.5rem' }}>No patients found</div>
                <div style={{ fontSize: '0.85rem' }}>Add your first patient to get started</div>
              </>
            )}
          </div>
        ) : (
          <>
            {searchTerm && (
              <div style={{ marginBottom: '1rem', padding: '0.75rem', background: '#f5f5f5', border: '1px solid #e0e0e0', fontSize: '0.85rem' }}>
                <strong>{filteredPatients.length}</strong> patient{filteredPatients.length === 1 ? '' : 's'} found
              </div>
            )}
            <div style={{ display: 'grid', gap: '1rem' }}>
              {filteredPatients.map((patient, index) => (
                <div 
                  key={patient.id} 
                  onClick={() => setSelectedPatient(patient)}
                  style={{ 
                    padding: '1.5rem', 
                    border: '2px solid #000000',
                    background: index % 2 === 0 ? '#ffffff' : '#fafafa',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1rem', textTransform: 'uppercase' }}>{patient.name}</div>
                      <div style={{ fontSize: '0.85rem', color: '#666666' }}>{patient.email}</div>
                      {patient.phone && (
                        <div style={{ fontSize: '0.85rem', color: '#666666', marginTop: '0.15rem' }}>{patient.phone}</div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.75rem', color: '#666666', textTransform: 'uppercase' }}>Active Protocols</div>
                      <div style={{ fontFamily: 'DM Sans', fontSize: '1.5rem', fontWeight: 700 }}>
                        {patient.protocols?.filter(p => p.status === 'active').length || 0}
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#666666', fontSize: '0.75rem' }}>
                    <span>Click to view details</span>
                    <ChevronRight size={14} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      </>
      )}
    </div>
  );
};

export default RangeMedicalSystem;
