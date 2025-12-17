// /pages/admin/patient/[id].js
// Patient Profile Page with Forms & Consents
// Range Medical

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

// Form URLs
const FORM_URLS = {
  intake: 'https://app.range-medical.com/intake.html',
  peptide: 'https://range-medical.com/peptide-therapy-consent-page',
  'iv-injection': 'https://range-medical.com/iv--injection-therapy-consent-page',
  blood_draw: 'https://range-medical.com/blood-draw-consent-page',
  'exosome-iv': 'https://range-medical.com/exosome-iv-therapy-consent-page',
  hrt: 'https://range-medical.com/hrt-consent-page',
  hbot: 'https://range-medical.com/hyperbaric-oxygen-therapy-consent-page',
  'red-light': 'https://range-medical.com/red-light-therapy-consent-page',
  'weight-loss': 'https://range-medical.com/weight-loss-consent-page',
  prp: 'https://range-medical.com/prp-consent-page',
  'testosterone-pellet': 'https://range-medical.com/testosterone-pellet-consent-page',
  'trt-fertility': 'https://range-medical.com/trt-fertility-waiver-page'
};

// Map purchase categories to required consent types
const CATEGORY_TO_CONSENT = {
  'Peptide': ['peptide'],
  'IV Therapy': ['iv-injection'],
  'Labs': ['blood_draw'],
  'Injection': ['iv-injection'],
  'HRT': ['hrt'],
  'Hyperbaric': ['hbot'],
  'Red Light': ['red-light'],
  'Weight Loss': ['weight-loss'],
  'Exosome': ['exosome-iv', 'iv-injection']
};

// Display names for consent types
const CONSENT_DISPLAY_NAMES = {
  'peptide': 'Peptide Therapy Consent',
  'iv-injection': 'IV/Injection Consent',
  'blood_draw': 'Blood Draw Consent',
  'exosome-iv': 'Exosome IV Consent',
  'hrt': 'HRT Consent',
  'hbot': 'Hyperbaric Oxygen Consent',
  'red-light': 'Red Light Therapy Consent',
  'weight-loss': 'Weight Loss Consent',
  'prp': 'PRP Consent',
  'testosterone-pellet': 'Testosterone Pellet Consent',
  'trt-fertility': 'TRT Fertility Waiver'
};

// Options for questionnaires
const PEPTIDE_ACTIVITIES = ['Walking', 'Running', 'Weight Training', 'Sports', 'Work/Job', 'Sleep', 'Driving'];
const PAIN_FREQUENCIES = ['Constant', 'Frequent', 'Intermittent', 'Only with activity', 'Only at night'];
const INJURY_DURATIONS = ['< 1 week', '1-2 weeks', '2-4 weeks', '1-3 months', '3-6 months', '6-12 months', '> 1 year'];
const EXERCISE_FREQUENCIES = ['None', '1-2x/week', '3-4x/week', '5+/week'];
const SIDE_EFFECTS = ['Nausea', 'Fatigue', 'Headache', 'Constipation', 'Dizziness', 'None'];

export default function PatientProfile() {
  const router = useRouter();
  const { id } = router.query;
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [patient, setPatient] = useState(null);
  const [protocols, setProtocols] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [questionnaires, setQuestionnaires] = useState([]);
  const [intakes, setIntakes] = useState([]);
  const [consents, setConsents] = useState([]);
  const [purchaseCategories, setPurchaseCategories] = useState([]);
  
  // UI state
  const [sendingReminder, setSendingReminder] = useState(null);
  const [updatingLocation, setUpdatingLocation] = useState(null);
  const [updatingReminders, setUpdatingReminders] = useState(null);
  const [updatingFrequency, setUpdatingFrequency] = useState(null);
  const [showQuestionnaireModal, setShowQuestionnaireModal] = useState(null);
  const [submittingQuestionnaire, setSubmittingQuestionnaire] = useState(false);
  const [sendingForm, setSendingForm] = useState(null);
  
  // Questionnaire form data
  const [formData, setFormData] = useState({
    sleep_quality: 5, energy_level: 5, current_medications: '', recovery_goals: '',
    goals_achieved: '', overall_improvement: 5, continue_treatment: true, additional_notes: '',
    primary_complaint: '', injury_location: '', injury_duration: '', pain_level: 5,
    pain_frequency: '', mobility_score: 5, activities_limited: [],
    current_weight: '', goal_weight: '', weight_at_completion: '', appetite_level: 5,
    cravings_level: 5, exercise_frequency: '', side_effects: [], side_effects_severity: 0
  });

  // Auth & data loading
  useEffect(() => {
    const stored = localStorage.getItem('adminPassword');
    if (stored) { setPassword(stored); setIsAuthenticated(true); }
    else setLoading(false);
  }, []);

  useEffect(() => {
    if (isAuthenticated && id) fetchPatientData();
  }, [isAuthenticated, id]);

  const fetchPatientData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/patient/${id}`, {
        headers: { 'Authorization': `Bearer ${password}` }
      });
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setPatient(data.patient);
      setProtocols(data.protocols || []);
      setPurchases(data.purchases || []);
      setQuestionnaires(data.questionnaires || []);
      setIntakes(data.intakes || []);
      setConsents(data.consents || []);
      setPurchaseCategories(data.purchaseCategories || []);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  // Toggle injection location
  const toggleInjectionLocation = async (protocolId, currentLocation) => {
    const newLocation = currentLocation === 'in_clinic' ? 'take_home' : 'in_clinic';
    setUpdatingLocation(protocolId);
    try {
      const res = await fetch(`/api/admin/protocol/${protocolId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${password}` },
        body: JSON.stringify({ injection_location: newLocation })
      });
      if (res.ok) {
        setProtocols(protocols.map(p => p.id === protocolId ? { ...p, injection_location: newLocation } : p));
      }
    } catch (err) {
      alert('Failed to update');
    }
    setUpdatingLocation(null);
  };

  // Toggle auto-texts (reminders)
  const toggleReminders = async (protocolId, currentValue) => {
    const newValue = !currentValue;
    setUpdatingReminders(protocolId);
    try {
      const res = await fetch(`/api/admin/protocol/${protocolId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${password}` },
        body: JSON.stringify({ reminders_enabled: newValue })
      });
      if (res.ok) {
        setProtocols(protocols.map(p => p.id === protocolId ? { ...p, reminders_enabled: newValue } : p));
      }
    } catch (err) {
      alert('Failed to update');
    }
    setUpdatingReminders(null);
  };

  // Toggle frequency for weight loss
  const toggleFrequency = async (protocolId, currentFrequency) => {
    const newFrequency = currentFrequency === '2x weekly' ? '1x weekly' : '2x weekly';
    setUpdatingFrequency(protocolId);
    try {
      const res = await fetch(`/api/admin/protocol/${protocolId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${password}` },
        body: JSON.stringify({ dose_frequency: newFrequency })
      });
      if (res.ok) {
        setProtocols(protocols.map(p => p.id === protocolId ? { ...p, dose_frequency: newFrequency } : p));
      }
    } catch (err) {
      alert('Failed to update');
    }
    setUpdatingFrequency(null);
  };

  // Send form via SMS
  const sendFormLink = async (formType, formUrl) => {
    if (!patient?.phone || !id) {
      alert('Patient phone number not available. Use "Copy Link" instead.');
      return;
    }
    setSendingForm(formType);
    try {
      const formName = formType === 'intake' ? 'Medical Intake Form' : CONSENT_DISPLAY_NAMES[formType] || 'Form';
      const message = `Hi ${patient.name?.split(' ')[0] || 'there'}! Please complete your ${formName} for Range Medical: ${formUrl}`;
      
      const res = await fetch('/api/admin/send-form-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${password}` },
        body: JSON.stringify({ contactId: id, message })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        alert(`${formName} link sent to ${patient.phone}!`);
      } else if (data.details?.message?.includes('Contact not found') || data.error?.includes('Contact not found')) {
        alert(`This patient is not in GHL yet.\n\nUse "Copy Link" button and text manually to:\n${patient.phone}`);
      } else {
        throw new Error(data.error || 'Failed to send');
      }
    } catch (err) {
      alert('Failed to send form link: ' + (err.message || 'Unknown error'));
    }
    setSendingForm(null);
  };

  // Send questionnaire reminder
  const sendReminder = async (protocolId, type) => {
    setSendingReminder(`${protocolId}-${type}`);
    try {
      const res = await fetch('/api/admin/send-questionnaire-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${password}` },
        body: JSON.stringify({ protocolId, reminderType: type })
      });
      if (res.ok) alert('Reminder sent!');
      else throw new Error('Failed');
    } catch (err) {
      alert('Failed to send reminder');
    }
    setSendingReminder(null);
  };

  // Open questionnaire modal
  const openQuestionnaireModal = (protocol, type) => {
    const category = getQuestionnaireCategory(protocol.program_type);
    setFormData({
      sleep_quality: 5, energy_level: 5, current_medications: '', recovery_goals: '',
      goals_achieved: '', overall_improvement: 5, continue_treatment: true, additional_notes: '',
      primary_complaint: '', injury_location: '', injury_duration: '', pain_level: 5,
      pain_frequency: '', mobility_score: 5, activities_limited: [],
      current_weight: '', goal_weight: '', weight_at_completion: '', appetite_level: 5,
      cravings_level: 5, exercise_frequency: '', side_effects: [], side_effects_severity: 0
    });
    setShowQuestionnaireModal({ protocol, type, category });
  };

  // Submit questionnaire
  const submitQuestionnaire = async () => {
    setSubmittingQuestionnaire(true);
    try {
      const res = await fetch('/api/admin/staff-questionnaire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${password}` },
        body: JSON.stringify({
          protocol_id: showQuestionnaireModal.protocol.id,
          questionnaire_type: showQuestionnaireModal.type,
          ...formData
        })
      });
      if (res.ok) {
        setShowQuestionnaireModal(null);
        fetchPatientData();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to submit');
      }
    } catch (err) {
      alert('Failed to submit questionnaire');
    }
    setSubmittingQuestionnaire(false);
  };

  // Helpers
  const getQuestionnaireCategory = (programType) => {
    if (!programType) return 'peptide';
    if (programType.includes('weight_loss')) return 'weight_loss';
    return 'peptide';
  };

  const getProtocolQuestionnaires = (protocolId) => questionnaires.filter(q => q.protocol_id === protocolId);

  const formatDate = (dateStr) => dateStr ? new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-';
  const formatCurrency = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);
  const getStatusColor = (status) => ({ active: '#4caf50', completed: '#2196f3', paused: '#ff9800', cancelled: '#9e9e9e' })[status] || '#666';
  const getCategoryColor = (cat) => ({ Peptide: '#4caf50', 'IV Therapy': '#2196f3', 'Weight Loss': '#ff9800', HRT: '#9c27b0', Labs: '#00bcd4', Injection: '#ff5722' })[cat] || '#666';

  // Get required consents based on purchases
  const getRequiredConsents = () => {
    const required = new Set();
    purchaseCategories.forEach(cat => {
      const consentTypes = CATEGORY_TO_CONSENT[cat] || [];
      consentTypes.forEach(type => required.add(type));
    });
    return Array.from(required);
  };

  // Check if consent type is completed
  const getConsentStatus = (consentType) => {
    const consent = consents.find(c => c.consent_type === consentType);
    return consent ? { completed: true, date: consent.submitted_at, pdfUrl: consent.pdf_url } : { completed: false };
  };

  // Handle login
  const handleLogin = async (e) => {
    e.preventDefault();
    localStorage.setItem('adminPassword', password);
    setIsAuthenticated(true);
  };

  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui', background: '#f5f5f5' }}>
        <form onSubmit={handleLogin} style={{ background: 'white', padding: '40px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h2 style={{ margin: '0 0 20px', textAlign: 'center' }}>Staff Login</h2>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" style={{ width: '250px', padding: '12px', border: '1px solid #ddd', borderRadius: '6px', marginBottom: '16px', display: 'block', boxSizing: 'border-box' }} />
          <button type="submit" style={{ width: '100%', padding: '12px', background: 'black', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Login</button>
        </form>
      </div>
    );
  }

  if (!id) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui' }}>
        <p>Please log in through the <Link href="/admin/dashboard" style={{ color: '#1976d2' }}>dashboard</Link></p>
      </div>
    );
  }

  return (
    <>
      <Head><title>{patient?.name || 'Patient'} | Range Medical</title></Head>
      <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: 'system-ui' }}>
        
        {/* Header */}
        <header style={{ background: 'black', color: 'white', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '600' }}>RANGE MEDICAL</h1>
            <p style={{ margin: '4px 0 0', fontSize: '14px', opacity: 0.8 }}>Patient Profile</p>
          </div>
          <button onClick={() => { localStorage.removeItem('adminPassword'); setIsAuthenticated(false); }}
            style={{ padding: '8px 16px', background: 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '4px', cursor: 'pointer' }}>
            Logout
          </button>
        </header>

        {/* Nav */}
        <nav style={{ background: 'white', borderBottom: '1px solid #e0e0e0', padding: '0 24px', display: 'flex' }}>
          {[{ href: '/admin/dashboard', label: 'Dashboard' }, { href: '/admin/protocols', label: 'Protocols' }, { href: '/admin/purchases', label: 'Purchases' }, { href: '/admin/patients', label: 'Patients', active: true }].map(item => (
            <Link key={item.href} href={item.href} style={{ padding: '16px 20px', color: item.active ? 'black' : '#666', textDecoration: 'none', borderBottom: item.active ? '2px solid black' : '2px solid transparent', fontWeight: item.active ? '500' : '400', fontSize: '14px' }}>
              {item.label}
            </Link>
          ))}
        </nav>

        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#666' }}>Loading...</div>
        ) : error ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#c62828' }}>{error}</div>
        ) : patient ? (
          <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
            <Link href="/admin/patients" style={{ color: '#666', textDecoration: 'none', fontSize: '14px', display: 'inline-block', marginBottom: '16px' }}>← Back to Patients</Link>

            {/* Patient Info Card */}
            <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '24px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h2 style={{ margin: '0 0 8px', fontSize: '28px', fontWeight: '600' }}>{patient.name}</h2>
                  <div style={{ display: 'flex', gap: '24px', color: '#666', fontSize: '14px' }}>
                    {patient.email && <span>📧 {patient.email}</span>}
                    {patient.phone && <span>📱 {patient.phone}</span>}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Total Spent</div>
                  <div style={{ fontSize: '24px', fontWeight: '600', color: '#2e7d32' }}>
                    {formatCurrency(purchases.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0))}
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div style={{ display: 'flex', gap: '24px', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #eee' }}>
                <div><div style={{ fontSize: '24px', fontWeight: '600' }}>{protocols.length}</div><div style={{ fontSize: '13px', color: '#666' }}>Protocols</div></div>
                <div><div style={{ fontSize: '24px', fontWeight: '600', color: '#1565c0' }}>{protocols.filter(p => p.injection_location === 'in_clinic').length}</div><div style={{ fontSize: '13px', color: '#666' }}>In-Clinic</div></div>
                <div><div style={{ fontSize: '24px', fontWeight: '600', color: '#e65100' }}>{protocols.filter(p => p.injection_location === 'take_home').length}</div><div style={{ fontSize: '13px', color: '#666' }}>Take-Home</div></div>
                <div><div style={{ fontSize: '24px', fontWeight: '600', color: protocols.filter(p => p.reminders_enabled && p.injection_location === 'take_home').length > 0 ? '#2e7d32' : '#999' }}>{protocols.filter(p => p.reminders_enabled && p.injection_location === 'take_home').length}</div><div style={{ fontSize: '13px', color: '#666' }}>Auto-Texts ON</div></div>
                <div><div style={{ fontSize: '24px', fontWeight: '600' }}>{questionnaires.length}</div><div style={{ fontSize: '13px', color: '#666' }}>Assessments</div></div>
              </div>
            </div>

            {/* Forms & Consents Section */}
            <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden', marginBottom: '24px' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #e0e0e0', background: '#fafafa' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>📋 Forms & Consents</h3>
              </div>
              
              {/* Medical Intake */}
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: intakes.length > 0 ? '#e8f5e9' : '#fff3e0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>
                    {intakes.length > 0 ? '✅' : '⚠️'}
                  </span>
                  <div>
                    <div style={{ fontWeight: '500', fontSize: '14px' }}>Medical Intake Form</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {intakes.length > 0 
                        ? `Completed ${formatDate(intakes[0].submitted_at)}` 
                        : 'Required - Not completed'}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {intakes.length > 0 && intakes[0].pdf_url && (
                    <a href={intakes[0].pdf_url} target="_blank" rel="noopener noreferrer"
                      style={{ padding: '6px 12px', background: '#e3f2fd', color: '#1565c0', borderRadius: '4px', fontSize: '12px', textDecoration: 'none', fontWeight: '500' }}>
                      View PDF
                    </a>
                  )}
                  {intakes.length === 0 && (
                    <>
                      <button 
                        onClick={() => sendFormLink('intake', FORM_URLS.intake)}
                        disabled={sendingForm === 'intake'}
                        style={{ padding: '6px 12px', background: '#ff9800', color: 'white', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', fontWeight: '500' }}>
                        {sendingForm === 'intake' ? 'Sending...' : '📱 Send Form'}
                      </button>
                      <button 
                        onClick={() => { navigator.clipboard.writeText(FORM_URLS.intake); alert('Link copied!'); }}
                        style={{ padding: '6px 12px', background: '#f5f5f5', color: '#333', border: '1px solid #ddd', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', fontWeight: '500' }}>
                        📋 Copy Link
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Required Consents based on purchases */}
              {getRequiredConsents().map(consentType => {
                const status = getConsentStatus(consentType);
                return (
                  <div key={consentType} style={{ padding: '16px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: status.completed ? '#e8f5e9' : '#ffebee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>
                        {status.completed ? '✅' : '❌'}
                      </span>
                      <div>
                        <div style={{ fontWeight: '500', fontSize: '14px' }}>{CONSENT_DISPLAY_NAMES[consentType]}</div>
                        <div style={{ fontSize: '12px', color: status.completed ? '#666' : '#c62828' }}>
                          {status.completed 
                            ? `Signed ${formatDate(status.date)}` 
                            : 'REQUIRED - Not signed'}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {status.completed && status.pdfUrl && (
                        <a href={status.pdfUrl} target="_blank" rel="noopener noreferrer"
                          style={{ padding: '6px 12px', background: '#e3f2fd', color: '#1565c0', borderRadius: '4px', fontSize: '12px', textDecoration: 'none', fontWeight: '500' }}>
                          View PDF
                        </a>
                      )}
                      {!status.completed && FORM_URLS[consentType] && (
                        <>
                          <button 
                            onClick={() => sendFormLink(consentType, FORM_URLS[consentType])}
                            disabled={sendingForm === consentType}
                            style={{ padding: '6px 12px', background: '#c62828', color: 'white', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', fontWeight: '500' }}>
                            {sendingForm === consentType ? 'Sending...' : '📱 Send Consent'}
                          </button>
                          <button 
                            onClick={() => { navigator.clipboard.writeText(FORM_URLS[consentType]); alert('Link copied!'); }}
                            style={{ padding: '6px 12px', background: '#f5f5f5', color: '#333', border: '1px solid #ddd', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', fontWeight: '500' }}>
                            📋 Copy
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Other completed consents not in required list */}
              {consents.filter(c => !getRequiredConsents().includes(c.consent_type)).map(consent => (
                <div key={consent.id} style={{ padding: '16px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fafafa' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#e8f5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>✅</span>
                    <div>
                      <div style={{ fontWeight: '500', fontSize: '14px' }}>{CONSENT_DISPLAY_NAMES[consent.consent_type] || consent.consent_type}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>Signed {formatDate(consent.submitted_at)}</div>
                    </div>
                  </div>
                  {consent.pdf_url && (
                    <a href={consent.pdf_url} target="_blank" rel="noopener noreferrer"
                      style={{ padding: '6px 12px', background: '#e3f2fd', color: '#1565c0', borderRadius: '4px', fontSize: '12px', textDecoration: 'none', fontWeight: '500' }}>
                      View PDF
                    </a>
                  )}
                </div>
              ))}

              {/* Empty state */}
              {getRequiredConsents().length === 0 && consents.length === 0 && intakes.length === 0 && (
                <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                  No forms or consents on file
                </div>
              )}
            </div>

            {/* Protocol History */}
            <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden', marginBottom: '24px' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #e0e0e0' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Protocol History & Assessments</h3>
              </div>
              {protocols.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>No protocols found</div>
              ) : (
                <div>
                  {protocols.map(protocol => {
                    const protocolQs = getProtocolQuestionnaires(protocol.id);
                    const intake = protocolQs.find(q => q.questionnaire_type === 'intake');
                    const completion = protocolQs.find(q => q.questionnaire_type === 'completion');
                    const daysLeft = protocol.end_date ? Math.ceil((new Date(protocol.end_date) - new Date()) / (1000*60*60*24)) : 0;
                    const isInClinic = protocol.injection_location === 'in_clinic';
                    const category = getQuestionnaireCategory(protocol.program_type);
                    const isWeightLoss = category === 'weight_loss';
                    
                    return (
                      <div key={protocol.id} style={{ padding: '20px', borderBottom: '1px solid #f0f0f0' }}>
                        {/* Protocol Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', flexWrap: 'wrap' }}>
                              <span style={{ fontWeight: '600', fontSize: '15px' }}>{protocol.program_name}</span>
                              <button onClick={() => toggleInjectionLocation(protocol.id, protocol.injection_location)} disabled={updatingLocation === protocol.id}
                                style={{ padding: '2px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '600', border: 'none', cursor: 'pointer', background: isInClinic ? '#e3f2fd' : '#fff3e0', color: isInClinic ? '#1565c0' : '#e65100' }}>
                                {updatingLocation === protocol.id ? '...' : isInClinic ? '🏥 In-Clinic' : '🏠 Take-Home'}
                              </button>
                              {isWeightLoss && (
                                <button onClick={() => toggleFrequency(protocol.id, protocol.dose_frequency)} disabled={updatingFrequency === protocol.id}
                                  style={{ padding: '2px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '600', border: 'none', cursor: 'pointer', background: protocol.dose_frequency === '2x weekly' ? '#fce4ec' : '#f3e5f5', color: protocol.dose_frequency === '2x weekly' ? '#c2185b' : '#7b1fa2' }}>
                                  {updatingFrequency === protocol.id ? '...' : protocol.dose_frequency === '2x weekly' ? '💉 2x Weekly' : '💉 1x Weekly'}
                                </button>
                              )}
                              {!isInClinic && (
                                <button onClick={() => toggleReminders(protocol.id, protocol.reminders_enabled)} disabled={updatingReminders === protocol.id}
                                  style={{ padding: '2px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '600', border: 'none', cursor: 'pointer', background: protocol.reminders_enabled ? '#e8f5e9' : '#ffebee', color: protocol.reminders_enabled ? '#2e7d32' : '#c62828' }}>
                                  {updatingReminders === protocol.id ? '...' : protocol.reminders_enabled ? '📱 Auto-Texts ON' : '📱 Auto-Texts OFF'}
                                </button>
                              )}
                            </div>
                            <div style={{ fontSize: '12px', color: '#666' }}>
                              {formatDate(protocol.start_date)} - {formatDate(protocol.end_date)}
                              {protocol.status === 'active' && daysLeft > 0 && <span style={{ marginLeft: '8px', color: '#4caf50' }}>({daysLeft} days left)</span>}
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '500', background: `${getStatusColor(protocol.status)}15`, color: getStatusColor(protocol.status) }}>{protocol.status}</span>
                            {!isInClinic && (
                              <button onClick={() => { navigator.clipboard.writeText(`https://app.range-medical.com/track/${protocol.access_token}`); alert('Link copied!'); }}
                                style={{ padding: '4px 8px', background: '#f5f5f5', border: '1px solid #ddd', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>
                                📱 Copy Link
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Assessment Actions */}
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: intake ? '#4caf50' : '#ddd' }} />
                            <span style={{ fontSize: '12px', color: intake ? '#4caf50' : '#999' }}>{intake ? 'Intake complete' : 'Intake pending'}</span>
                            {!intake && (
                              isInClinic ? (
                                <button onClick={() => openQuestionnaireModal(protocol, 'intake')} style={{ padding: '2px 8px', fontSize: '10px', background: '#4caf50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Complete</button>
                              ) : protocol.ghl_contact_id && (
                                <button onClick={() => sendReminder(protocol.id, 'intake')} disabled={sendingReminder === `${protocol.id}-intake`}
                                  style={{ padding: '2px 8px', fontSize: '10px', background: '#fff', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer' }}>
                                  {sendingReminder === `${protocol.id}-intake` ? '...' : 'Send Reminder'}
                                </button>
                              )
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: completion ? '#4caf50' : '#ddd' }} />
                            <span style={{ fontSize: '12px', color: completion ? '#4caf50' : '#999' }}>{completion ? 'Completion complete' : 'Completion pending'}</span>
                            {!completion && intake && (
                              isInClinic ? (
                                <button onClick={() => openQuestionnaireModal(protocol, 'completion')} style={{ padding: '2px 8px', fontSize: '10px', background: '#2196f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Complete</button>
                              ) : protocol.ghl_contact_id && (
                                <button onClick={() => sendReminder(protocol.id, 'completion')} disabled={sendingReminder === `${protocol.id}-completion`}
                                  style={{ padding: '2px 8px', fontSize: '10px', background: '#fff', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer' }}>
                                  {sendingReminder === `${protocol.id}-completion` ? '...' : 'Send Reminder'}
                                </button>
                              )
                            )}
                          </div>
                        </div>

                        {/* Scores Display */}
                        {(intake || completion) && (
                          <div style={{ display: 'flex', gap: '20px', padding: '12px', background: '#fafafa', borderRadius: '6px', fontSize: '13px' }}>
                            {intake && (
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '10px', color: '#666', marginBottom: '8px', fontWeight: '600' }}>INTAKE</div>
                                {isWeightLoss ? (
                                  <div style={{ display: 'flex', gap: '16px' }}>
                                    <div><span style={{ fontWeight: '600' }}>{intake.current_weight}</span> lbs</div>
                                    <div><span style={{ fontWeight: '600' }}>{intake.appetite_level}/10</span> appetite</div>
                                    <div><span style={{ fontWeight: '600' }}>{intake.cravings_level}/10</span> cravings</div>
                                  </div>
                                ) : (
                                  <div style={{ display: 'flex', gap: '16px' }}>
                                    <div><span style={{ fontWeight: '600' }}>{intake.pain_level}</span> pain</div>
                                    <div><span style={{ fontWeight: '600' }}>{intake.mobility_score}</span> mobility</div>
                                    <div><span style={{ fontWeight: '600' }}>{intake.sleep_quality}</span> sleep</div>
                                  </div>
                                )}
                              </div>
                            )}
                            {completion && (
                              <div style={{ flex: 1, borderLeft: intake ? '1px solid #e0e0e0' : 'none', paddingLeft: intake ? '20px' : '0' }}>
                                <div style={{ fontSize: '10px', color: '#2e7d32', marginBottom: '8px', fontWeight: '600' }}>COMPLETION</div>
                                {isWeightLoss ? (
                                  <div style={{ display: 'flex', gap: '16px' }}>
                                    <div>
                                      <span style={{ fontWeight: '600' }}>{completion.weight_at_completion}</span> lbs
                                      {intake?.current_weight && <span style={{ fontSize: '11px', marginLeft: '4px', color: parseFloat(completion.weight_at_completion) < parseFloat(intake.current_weight) ? '#4caf50' : '#c62828' }}>
                                        ({parseFloat(intake.current_weight) - parseFloat(completion.weight_at_completion) > 0 ? '-' : '+'}{Math.abs(parseFloat(intake.current_weight) - parseFloat(completion.weight_at_completion)).toFixed(1)})
                                      </span>}
                                    </div>
                                    <div><span style={{ fontWeight: '600' }}>{completion.appetite_level}/10</span> appetite</div>
                                  </div>
                                ) : (
                                  <div style={{ display: 'flex', gap: '16px' }}>
                                    <div>
                                      <span style={{ fontWeight: '600' }}>{completion.pain_level}</span> pain
                                      {intake && <span style={{ fontSize: '11px', marginLeft: '4px', color: completion.pain_level < intake.pain_level ? '#4caf50' : '#c62828' }}>
                                        ({completion.pain_level < intake.pain_level ? '↓' : '↑'}{Math.abs(intake.pain_level - completion.pain_level)})
                                      </span>}
                                    </div>
                                    <div>
                                      <span style={{ fontWeight: '600' }}>{completion.mobility_score}</span> mobility
                                      {intake && <span style={{ fontSize: '11px', marginLeft: '4px', color: completion.mobility_score > intake.mobility_score ? '#4caf50' : '#c62828' }}>
                                        ({completion.mobility_score > intake.mobility_score ? '↑' : '↓'}{Math.abs(completion.mobility_score - intake.mobility_score)})
                                      </span>}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Purchases */}
            <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Purchase History</h3>
                <span style={{ fontSize: '13px', color: '#666' }}>{purchases.length} total</span>
              </div>
              {purchases.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>No purchases found</div>
              ) : (
                <div style={{ maxHeight: '300px', overflow: 'auto' }}>
                  {purchases.map(purchase => (
                    <div key={purchase.id} style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: '500', fontSize: '14px' }}>{purchase.item_name}</div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                          <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '500', background: `${getCategoryColor(purchase.category)}15`, color: getCategoryColor(purchase.category) }}>{purchase.category}</span>
                          <span style={{ fontSize: '12px', color: '#666' }}>{formatDate(purchase.purchase_date)}</span>
                        </div>
                      </div>
                      <div style={{ fontWeight: '600', fontSize: '14px' }}>{formatCurrency(purchase.amount)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ padding: '60px', textAlign: 'center', color: '#666' }}>Patient not found</div>
        )}

        {/* Staff Questionnaire Modal */}
        {showQuestionnaireModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: 'white', borderRadius: '12px', width: '90%', maxWidth: '500px', maxHeight: '90vh', overflow: 'auto' }}>
              <div style={{ padding: '20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'white' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px' }}>{showQuestionnaireModal.type === 'intake' ? 'Intake' : 'Completion'} Assessment</h3>
                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#666' }}>{showQuestionnaireModal.protocol.patient_name}</p>
                </div>
                <button onClick={() => setShowQuestionnaireModal(null)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#666' }}>×</button>
              </div>
              
              <div style={{ padding: '20px' }}>
                {showQuestionnaireModal.category === 'peptide' && (
                  <>
                    {showQuestionnaireModal.type === 'intake' && (
                      <>
                        <div style={{ marginBottom: '16px' }}>
                          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Primary Complaint *</label>
                          <input type="text" value={formData.primary_complaint} onChange={(e) => setFormData({...formData, primary_complaint: e.target.value})} placeholder="e.g., Shoulder pain" style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', boxSizing: 'border-box' }} />
                        </div>
                        <div style={{ marginBottom: '16px' }}>
                          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Location *</label>
                          <input type="text" value={formData.injury_location} onChange={(e) => setFormData({...formData, injury_location: e.target.value})} placeholder="e.g., Right shoulder" style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', boxSizing: 'border-box' }} />
                        </div>
                        <div style={{ marginBottom: '16px' }}>
                          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Duration</label>
                          <select value={formData.injury_duration} onChange={(e) => setFormData({...formData, injury_duration: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', boxSizing: 'border-box' }}>
                            <option value="">Select...</option>
                            {INJURY_DURATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                          </select>
                        </div>
                      </>
                    )}
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Pain Level: {formData.pain_level}/10</label>
                      <input type="range" min="0" max="10" value={formData.pain_level} onChange={(e) => setFormData({...formData, pain_level: parseInt(e.target.value)})} style={{ width: '100%' }} />
                    </div>
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Mobility Score: {formData.mobility_score}/10</label>
                      <input type="range" min="0" max="10" value={formData.mobility_score} onChange={(e) => setFormData({...formData, mobility_score: parseInt(e.target.value)})} style={{ width: '100%' }} />
                    </div>
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Sleep Quality: {formData.sleep_quality}/10</label>
                      <input type="range" min="0" max="10" value={formData.sleep_quality} onChange={(e) => setFormData({...formData, sleep_quality: parseInt(e.target.value)})} style={{ width: '100%' }} />
                    </div>
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Energy Level: {formData.energy_level}/10</label>
                      <input type="range" min="0" max="10" value={formData.energy_level} onChange={(e) => setFormData({...formData, energy_level: parseInt(e.target.value)})} style={{ width: '100%' }} />
                    </div>
                    {showQuestionnaireModal.type === 'completion' && (
                      <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Overall Improvement: {formData.overall_improvement}/10</label>
                        <input type="range" min="0" max="10" value={formData.overall_improvement} onChange={(e) => setFormData({...formData, overall_improvement: parseInt(e.target.value)})} style={{ width: '100%' }} />
                      </div>
                    )}
                  </>
                )}
                
                {showQuestionnaireModal.category === 'weight_loss' && (
                  <>
                    {showQuestionnaireModal.type === 'intake' && (
                      <>
                        <div style={{ marginBottom: '16px' }}>
                          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Current Weight (lbs) *</label>
                          <input type="number" value={formData.current_weight} onChange={(e) => setFormData({...formData, current_weight: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', boxSizing: 'border-box' }} />
                        </div>
                        <div style={{ marginBottom: '16px' }}>
                          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Goal Weight (lbs)</label>
                          <input type="number" value={formData.goal_weight} onChange={(e) => setFormData({...formData, goal_weight: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', boxSizing: 'border-box' }} />
                        </div>
                      </>
                    )}
                    {showQuestionnaireModal.type === 'completion' && (
                      <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Weight at Completion (lbs) *</label>
                        <input type="number" value={formData.weight_at_completion} onChange={(e) => setFormData({...formData, weight_at_completion: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', boxSizing: 'border-box' }} />
                      </div>
                    )}
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Appetite Level: {formData.appetite_level}/10</label>
                      <input type="range" min="0" max="10" value={formData.appetite_level} onChange={(e) => setFormData({...formData, appetite_level: parseInt(e.target.value)})} style={{ width: '100%' }} />
                    </div>
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Cravings Level: {formData.cravings_level}/10</label>
                      <input type="range" min="0" max="10" value={formData.cravings_level} onChange={(e) => setFormData({...formData, cravings_level: parseInt(e.target.value)})} style={{ width: '100%' }} />
                    </div>
                  </>
                )}
                
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Notes</label>
                  <textarea value={formData.additional_notes} onChange={(e) => setFormData({...formData, additional_notes: e.target.value})} rows={3} style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', boxSizing: 'border-box', resize: 'vertical' }} />
                </div>
                
                <button onClick={submitQuestionnaire} disabled={submittingQuestionnaire}
                  style={{ width: '100%', padding: '14px', background: 'black', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}>
                  {submittingQuestionnaire ? 'Saving...' : 'Save Assessment'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
