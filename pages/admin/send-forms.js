// /pages/admin/send-forms.js
// Standalone Send Forms & Guides page — send consent/form/guide links via SMS or Email
// Range Medical System V2

import { useState, useRef, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';

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
  { id: 'prp', name: 'PRP Consent', icon: '🩸', time: '5 min' },
  { id: 'exosome-iv', name: 'Exosome IV Consent', icon: '🧬', time: '5 min' },
  { id: 'knee-aspiration', name: 'Knee Aspiration Consent', icon: '🦵', time: '5 min' },
  { id: 'questionnaire', name: 'Baseline Questionnaire', icon: '📊', time: '10 min' },
];

const QUICK_SELECTIONS = [
  { label: 'New Patient', forms: ['intake', 'hipaa'] },
  { label: 'HRT Patient', forms: ['intake', 'hipaa', 'hrt', 'blood-draw'] },
  { label: 'Weight Loss', forms: ['intake', 'hipaa', 'weight-loss', 'blood-draw'] },
  { label: 'IV Therapy', forms: ['intake', 'hipaa', 'iv'] },
  { label: 'Peptides', forms: ['intake', 'hipaa', 'peptide'] },
  { label: 'HBOT', forms: ['intake', 'hipaa', 'hbot'] },
  { label: 'Red Light', forms: ['intake', 'hipaa', 'red-light'] },
  { label: 'PRP', forms: ['intake', 'hipaa', 'prp', 'blood-draw'] },
  { label: 'Exosome IV', forms: ['intake', 'hipaa', 'exosome-iv'] },
  { label: 'Knee Aspiration', forms: ['intake', 'hipaa', 'knee-aspiration'] },
  { label: 'Labs + Questionnaire', forms: ['intake', 'hipaa', 'blood-draw', 'questionnaire'] },
];

const AVAILABLE_GUIDES = [
  { id: 'hrt-guide', name: 'HRT Guide', icon: '💊', category: 'hrt' },
  { id: 'tirzepatide-guide', name: 'Tirzepatide Guide', icon: '⚖️', category: 'weight_loss' },
  { id: 'retatrutide-guide', name: 'Retatrutide Guide', icon: '⚖️', category: 'weight_loss' },
  { id: 'weight-loss-medication-guide-page', name: 'WL Medication Guide', icon: '⚖️', category: 'weight_loss' },
  { id: 'bpc-tb4-guide', name: 'BPC/TB4 Guide', icon: '🧬', category: 'peptide' },
  { id: 'recovery-blend-guide', name: 'Recovery Blend Guide', icon: '🧬', category: 'peptide' },
  { id: 'glow-guide', name: 'GLOW Guide', icon: '✨', category: 'peptide' },
  { id: 'ghk-cu-guide', name: 'GHK-Cu Guide', icon: '🧬', category: 'peptide' },
  { id: '3x-blend-guide', name: '3x Blend Guide', icon: '🧬', category: 'peptide' },
  { id: 'nad-guide', name: 'NAD+ Guide', icon: '💧', category: 'iv' },
  { id: 'methylene-blue-iv-guide', name: 'Methylene Blue Guide', icon: '💧', category: 'iv' },
  { id: 'methylene-blue-combo-iv-guide', name: 'MB+VitC Combo Guide', icon: '💧', category: 'iv' },
  { id: 'glutathione-iv-guide', name: 'Glutathione Guide', icon: '💧', category: 'iv' },
  { id: 'vitamin-c-iv-guide', name: 'Vitamin C Guide', icon: '💧', category: 'iv' },
  { id: 'range-iv-guide', name: 'Range IV Guide', icon: '💧', category: 'iv' },
  { id: 'cellular-reset-guide', name: 'Cellular Reset Guide', icon: '💧', category: 'iv' },
  { id: 'hbot-guide', name: 'HBOT Guide', icon: '🫁', category: 'hbot' },
  { id: 'red-light-guide', name: 'Red Light Guide', icon: '🔴', category: 'rlt' },
  { id: 'combo-membership-guide', name: 'Combo Membership', icon: '🏷️', category: 'membership' },
  { id: 'hbot-membership-guide', name: 'HBOT Membership', icon: '🏷️', category: 'membership' },
  { id: 'rlt-membership-guide', name: 'RLT Membership', icon: '🏷️', category: 'membership' },
  { id: 'essential-panel-male-guide', name: 'Essential Male Panel', icon: '🧪', category: 'labs' },
  { id: 'essential-panel-female-guide', name: 'Essential Female Panel', icon: '🧪', category: 'labs' },
  { id: 'elite-panel-male-guide', name: 'Elite Male Panel', icon: '🧪', category: 'labs' },
  { id: 'elite-panel-female-guide', name: 'Elite Female Panel', icon: '🧪', category: 'labs' },
  { id: 'the-blu-guide', name: 'The Blu', icon: '💎', category: 'other' },
];

const GUIDE_CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'hrt', label: 'HRT' },
  { id: 'weight_loss', label: 'Weight Loss' },
  { id: 'peptide', label: 'Peptides' },
  { id: 'iv', label: 'IV Therapy' },
  { id: 'hbot', label: 'HBOT' },
  { id: 'rlt', label: 'Red Light' },
  { id: 'membership', label: 'Memberships' },
  { id: 'labs', label: 'Labs' },
];

export default function SendFormsPage() {
  // Page mode: forms, guides, or questionnaire
  const [pageMode, setPageMode] = useState('forms'); // 'forms' | 'guides' | 'questionnaire'

  // Patient selection
  const [mode, setMode] = useState('search'); // 'search' | 'manual'
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [manualName, setManualName] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const searchTimeout = useRef(null);

  // Form selection
  const [selectedForms, setSelectedForms] = useState([]);

  // Guide selection
  const [selectedGuides, setSelectedGuides] = useState([]);
  const [guideCategory, setGuideCategory] = useState('all');

  // Delivery method
  const [deliveryMethod, setDeliveryMethod] = useState('email'); // 'sms' | 'email'

  // Blooio opt-in status
  const [blooioOptIn, setBlooioOptIn] = useState(null); // null = unknown, true = opted in, false = first contact

  // Status
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [recentSends, setRecentSends] = useState([]);

  // Check Blooio opt-in when patient + SMS selected
  useEffect(() => {
    const phone = mode === 'search' && selectedPatient ? selectedPatient.phone : manualPhone;
    if (deliveryMethod !== 'sms' || !phone || phone.replace(/\D/g, '').length < 10) {
      setBlooioOptIn(null);
      return;
    }

    let cancelled = false;
    const checkOptIn = async () => {
      try {
        const digits = phone.replace(/\D/g, '');
        const res = await fetch(`/api/blooio/check-optin?phone=${encodeURIComponent(digits)}`);
        const data = await res.json();
        if (!cancelled) {
          if (data.provider === 'twilio') {
            setBlooioOptIn(null); // Not using Blooio, not relevant
          } else {
            setBlooioOptIn(data.optedIn);
          }
        }
      } catch (err) {
        console.error('Opt-in check error:', err);
        if (!cancelled) setBlooioOptIn(null);
      }
    };

    checkOptIn();
    return () => { cancelled = true; };
  }, [deliveryMethod, selectedPatient, manualPhone, mode]);

  // Patient search
  const handleSearch = (query) => {
    setSearchQuery(query);
    setSelectedPatient(null);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }
    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/patients/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setSearchResults(data.patients || data || []);
      } catch (err) {
        console.error('Search error:', err);
      }
    }, 300);
  };

  const selectPatient = async (patient) => {
    try {
      const res = await fetch(`/api/patients/${patient.id}`);
      const data = await res.json();
      const p = data.patient || data;
      setSelectedPatient({
        id: p.id,
        name: p.first_name && p.last_name ? `${p.first_name} ${p.last_name}` : p.name,
        firstName: p.first_name || (p.name || '').split(' ')[0],
        phone: p.phone || '',
        email: p.email || '',
        ghl_contact_id: p.ghl_contact_id || null,
      });
    } catch (err) {
      setSelectedPatient({
        id: patient.id,
        name: patient.first_name && patient.last_name ? `${patient.first_name} ${patient.last_name}` : patient.name,
        firstName: patient.first_name || (patient.name || '').split(' ')[0],
        phone: patient.phone || '',
        email: patient.email || '',
      });
    }
    setSearchResults([]);
    setSearchQuery('');
  };

  const toggleForm = (formId) => {
    setSelectedForms(prev =>
      prev.includes(formId) ? prev.filter(id => id !== formId) : [...prev, formId]
    );
  };

  const toggleGuide = (guideId) => {
    setSelectedGuides(prev =>
      prev.includes(guideId) ? prev.filter(id => id !== guideId) : [...prev, guideId]
    );
  };

  const applyQuickSelect = (forms) => {
    setSelectedForms(forms);
  };

  // Sort forms so intake is always first, hipaa second, then rest
  const sortForms = (formIds) => {
    const PRIORITY_ORDER = ['intake', 'hipaa'];
    return [...formIds].sort((a, b) => {
      const aIdx = PRIORITY_ORDER.indexOf(a);
      const bIdx = PRIORITY_ORDER.indexOf(b);
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      if (aIdx !== -1) return -1;
      if (bIdx !== -1) return 1;
      return 0;
    });
  };

  const getRecipient = () => {
    if (mode === 'search' && selectedPatient) {
      return deliveryMethod === 'sms' ? selectedPatient.phone : selectedPatient.email;
    }
    return deliveryMethod === 'sms' ? manualPhone : manualEmail;
  };

  const getFirstName = () => {
    if (mode === 'search' && selectedPatient) return selectedPatient.firstName;
    return manualName.split(' ')[0] || '';
  };

  const getSelectedCount = () => {
    if (pageMode === 'questionnaire') return selectedPatient ? 1 : 0;
    return pageMode === 'forms' ? selectedForms.length : selectedGuides.length;
  };

  const canSend = () => {
    if (pageMode === 'questionnaire') {
      if (!selectedPatient) return false;
      const recipient = getRecipient();
      if (!recipient) return false;
      if (deliveryMethod === 'sms') return recipient.replace(/\D/g, '').length >= 10;
      return recipient.includes('@');
    }
    if (getSelectedCount() === 0) return false;
    const recipient = getRecipient();
    if (!recipient) return false;
    if (deliveryMethod === 'sms') {
      return recipient.replace(/\D/g, '').length >= 10;
    }
    return recipient.includes('@');
  };

  const handleSend = async () => {
    if (!canSend()) return;
    setSending(true);
    setResult(null);

    const firstName = getFirstName();
    const patient = mode === 'search' ? selectedPatient : null;

    try {
      if (pageMode === 'questionnaire') {
        await sendQuestionnaire(patient);
      } else if (pageMode === 'forms') {
        await sendForms(firstName, patient);
      } else {
        await sendGuides(firstName, patient);
      }
    } catch (err) {
      setResult({ success: false, message: err.message });
    } finally {
      setSending(false);
    }
  };

  const sendForms = async (firstName, patient) => {
    const sortedForms = sortForms(selectedForms);

    if (deliveryMethod === 'email') {
      const email = mode === 'search' ? selectedPatient.email : manualEmail;
      const res = await fetch('/api/admin/send-forms-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          firstName: firstName || null,
          formIds: sortedForms,
          patientId: patient?.id || null,
          patientName: patient?.name || manualName || null,
          ghlContactId: patient?.ghl_contact_id || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send email');

      setResult({ success: true, message: `${selectedForms.length} form${selectedForms.length > 1 ? 's' : ''} sent via email` });
      addRecentSend(patient?.name || manualName || email, 'email', selectedForms.length, 'forms');
    } else {
      const phone = mode === 'search' ? selectedPatient.phone : manualPhone;
      const digits = phone.replace(/\D/g, '');
      const res = await fetch('/api/send-forms-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits,
          firstName: firstName || null,
          formIds: sortedForms,
          patientId: patient?.id || null,
          patientName: patient?.name || manualName || null,
          ghlContactId: patient?.ghl_contact_id || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send SMS');

      if (data.twoStep) {
        setResult({ success: true, message: `Opt-in message sent. ${selectedForms.length} form${selectedForms.length > 1 ? 's' : ''} will deliver when patient replies.` });
        addRecentSend(patient?.name || manualName || phone, 'sms', selectedForms.length, 'forms (pending reply)');
      } else {
        setResult({ success: true, message: `${selectedForms.length} form${selectedForms.length > 1 ? 's' : ''} sent via SMS` });
        addRecentSend(patient?.name || manualName || phone, 'sms', selectedForms.length, 'forms');
      }
    }

    setSelectedForms([]);
  };

  const sendGuides = async (firstName, patient) => {
    if (deliveryMethod === 'email') {
      const email = mode === 'search' ? selectedPatient.email : manualEmail;
      const res = await fetch('/api/admin/send-guides-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          firstName: firstName || null,
          guideIds: selectedGuides,
          patientId: patient?.id || null,
          patientName: patient?.name || manualName || null,
          ghlContactId: patient?.ghl_contact_id || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send email');

      setResult({ success: true, message: `${selectedGuides.length} guide${selectedGuides.length > 1 ? 's' : ''} sent via email` });
      addRecentSend(patient?.name || manualName || email, 'email', selectedGuides.length, 'guides');
    } else {
      const phone = mode === 'search' ? selectedPatient.phone : manualPhone;
      const digits = phone.replace(/\D/g, '');
      const res = await fetch('/api/send-guide-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits,
          firstName: firstName || null,
          guideIds: selectedGuides,
          patientId: patient?.id || null,
          patientName: patient?.name || manualName || null,
          ghlContactId: patient?.ghl_contact_id || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send SMS');

      if (data.twoStep) {
        setResult({ success: true, message: `Opt-in message sent. ${selectedGuides.length} guide${selectedGuides.length > 1 ? 's' : ''} will deliver when patient replies.` });
        addRecentSend(patient?.name || manualName || phone, 'sms', selectedGuides.length, 'guides (pending reply)');
      } else {
        setResult({ success: true, message: `${selectedGuides.length} guide${selectedGuides.length > 1 ? 's' : ''} sent via SMS` });
        addRecentSend(patient?.name || manualName || phone, 'sms', selectedGuides.length, 'guides');
      }
    }

    setSelectedGuides([]);
  };

  const sendQuestionnaire = async (patient) => {
    if (!patient) throw new Error('Patient must be selected from search');

    if (deliveryMethod === 'email') {
      const email = patient.email;
      if (!email) throw new Error('Patient has no email address');
      const res = await fetch('/api/symptoms/send-link-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: patient.id,
          email,
          name: patient.name,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send email');

      setResult({ success: true, message: 'Symptoms questionnaire sent via email' });
      addRecentSend(patient.name, 'email', 1, 'questionnaire');
    } else {
      const phone = patient.phone;
      if (!phone) throw new Error('Patient has no phone number');
      const res = await fetch('/api/symptoms/send-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: patient.id,
          phone,
          name: patient.name,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send SMS');

      setResult({ success: true, message: 'Symptoms questionnaire sent via SMS' });
      addRecentSend(patient.name, 'sms', 1, 'questionnaire');
    }
  };

  const copyQuestionnaireLink = () => {
    if (!selectedPatient) return;
    const url = `https://app.range-medical.com/symptom-questionnaire?patient=${selectedPatient.id}&name=${encodeURIComponent(selectedPatient.name)}`;
    navigator.clipboard.writeText(url).then(() => {
      setResult({ success: true, message: 'Questionnaire link copied to clipboard' });
    }).catch(() => {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = url;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setResult({ success: true, message: 'Questionnaire link copied to clipboard' });
    });
  };

  const addRecentSend = (name, method, count, type) => {
    setRecentSends(prev => [
      { name, method, count, type, time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) },
      ...prev.slice(0, 9),
    ]);
  };

  const formatPhone = (value) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  // Filtered guides by category
  const filteredGuides = guideCategory === 'all'
    ? AVAILABLE_GUIDES
    : AVAILABLE_GUIDES.filter(g => g.category === guideCategory);

  const itemLabel = pageMode === 'questionnaire' ? 'Questionnaire' : pageMode === 'forms' ? 'Form' : 'Guide';
  const itemLabelPlural = pageMode === 'questionnaire' ? 'Questionnaire' : pageMode === 'forms' ? 'Forms' : 'Guides';
  const selectedCount = getSelectedCount();

  return (
    <AdminLayout title="Send Forms">
      <div style={styles.layout}>
        {/* Main form area */}
        <div style={styles.mainCard}>

          {/* Page mode toggle: Forms / Guides */}
          <div style={styles.pageModeBar}>
            <button
              onClick={() => { setPageMode('forms'); setResult(null); }}
              style={{
                ...styles.pageModeBtn,
                ...(pageMode === 'forms' ? styles.pageModeBtnActive : {}),
              }}
            >
              📋 Forms
            </button>
            <button
              onClick={() => { setPageMode('guides'); setResult(null); }}
              style={{
                ...styles.pageModeBtn,
                ...(pageMode === 'guides' ? styles.pageModeBtnActive : {}),
              }}
            >
              📖 Guides
            </button>
            <button
              onClick={() => { setPageMode('questionnaire'); setResult(null); }}
              style={{
                ...styles.pageModeBtn,
                ...(pageMode === 'questionnaire' ? styles.pageModeBtnActive : {}),
              }}
            >
              📊 Questionnaire
            </button>
          </div>

          {/* Step 1: Patient */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <span style={styles.stepBadge}>1</span>
              <h3 style={styles.sectionTitle}>Patient</h3>
            </div>

            {/* Mode toggle */}
            {pageMode !== 'questionnaire' ? (
              <div style={styles.modeToggle}>
                <button
                  onClick={() => { setMode('search'); setSelectedPatient(null); }}
                  style={{ ...styles.modeBtn, ...(mode === 'search' ? styles.modeBtnActive : {}) }}
                >
                  Search Patient
                </button>
                <button
                  onClick={() => { setMode('manual'); setSelectedPatient(null); }}
                  style={{ ...styles.modeBtn, ...(mode === 'manual' ? styles.modeBtnActive : {}) }}
                >
                  Manual Entry
                </button>
              </div>
            ) : (
              <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#666' }}>
                Search for a patient to send their symptoms questionnaire
              </p>
            )}

            {(mode === 'search' || pageMode === 'questionnaire') ? (
              <div>
                {!selectedPatient ? (
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => handleSearch(e.target.value)}
                      placeholder="Search by name..."
                      style={styles.input}
                    />
                    {searchResults.length > 0 && (
                      <div style={styles.dropdown}>
                        {searchResults.slice(0, 8).map(p => (
                          <div
                            key={p.id}
                            onClick={() => selectPatient(p)}
                            style={styles.dropdownItem}
                          >
                            <span style={styles.dropdownName}>
                              {p.first_name && p.last_name ? `${p.first_name} ${p.last_name}` : p.name}
                            </span>
                            {p.phone && <span style={styles.dropdownPhone}>{p.phone}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={styles.selectedPatient}>
                    <div>
                      <div style={styles.selectedName}>{selectedPatient.name}</div>
                      {selectedPatient.phone && (
                        <div style={styles.selectedDetail}>Phone: {selectedPatient.phone}</div>
                      )}
                      {selectedPatient.email && (
                        <div style={styles.selectedDetail}>Email: {selectedPatient.email}</div>
                      )}
                    </div>
                    <button
                      onClick={() => { setSelectedPatient(null); setSearchQuery(''); }}
                      style={styles.changeBtn}
                    >
                      Change
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div style={styles.manualFields}>
                <input
                  type="text"
                  value={manualName}
                  onChange={e => setManualName(e.target.value)}
                  placeholder="Patient name (optional)"
                  style={styles.input}
                />
                <input
                  type="tel"
                  value={manualPhone}
                  onChange={e => setManualPhone(formatPhone(e.target.value))}
                  placeholder="Phone number"
                  style={styles.input}
                />
                <input
                  type="email"
                  value={manualEmail}
                  onChange={e => setManualEmail(e.target.value)}
                  placeholder="Email address"
                  style={styles.input}
                />
              </div>
            )}
          </div>

          {/* Step 2: Select Forms, Guides, or Questionnaire info */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <span style={styles.stepBadge}>2</span>
              <h3 style={styles.sectionTitle}>{pageMode === 'questionnaire' ? 'Questionnaire' : `Select ${itemLabelPlural}`}</h3>
            </div>

            {pageMode === 'questionnaire' ? (
              <div style={styles.questionnaireCard}>
                <div style={styles.questionnaireIcon}>📊</div>
                <div style={styles.questionnaireInfo}>
                  <div style={styles.questionnaireName}>Symptoms Questionnaire</div>
                  <div style={styles.questionnaireMeta}>19 questions · ~5 min</div>
                  <div style={styles.questionnaireDesc}>
                    Tracks energy, sleep, mood, weight management, physical recovery, and hormonal health. Responses are scored 1–10 and stored for progress tracking.
                  </div>
                </div>
                {selectedPatient && (
                  <button onClick={copyQuestionnaireLink} style={styles.copyLinkBtn}>
                    📋 Copy Link
                  </button>
                )}
              </div>
            ) : pageMode === 'forms' ? (
              <>
                {/* Quick selections */}
                <div style={styles.quickRow}>
                  {QUICK_SELECTIONS.map(qs => (
                    <button
                      key={qs.label}
                      onClick={() => applyQuickSelect(qs.forms)}
                      style={{
                        ...styles.quickBtn,
                        ...(JSON.stringify([...selectedForms].sort()) === JSON.stringify([...qs.forms].sort())
                          ? styles.quickBtnActive : {}),
                      }}
                    >
                      {qs.label}
                    </button>
                  ))}
                </div>

                {/* Required forms — always first */}
                <div style={styles.groupLabel}>Required</div>
                <div style={styles.formGrid}>
                  {AVAILABLE_FORMS.filter(f => f.required).map(form => {
                    const isChecked = selectedForms.includes(form.id);
                    return (
                      <label
                        key={form.id}
                        style={{
                          ...styles.formItem,
                          ...(isChecked ? styles.formItemChecked : {}),
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleForm(form.id)}
                          style={styles.checkbox}
                        />
                        <span style={styles.formIcon}>{form.icon}</span>
                        <span style={styles.formName}>{form.name}</span>
                        <span style={styles.formTime}>{form.time}</span>
                      </label>
                    );
                  })}
                </div>

                {/* Consent forms */}
                <div style={{ ...styles.groupLabel, marginTop: '14px' }}>Consent Forms</div>
                <div style={styles.formGrid}>
                  {AVAILABLE_FORMS.filter(f => !f.required).map(form => {
                    const isChecked = selectedForms.includes(form.id);
                    return (
                      <label
                        key={form.id}
                        style={{
                          ...styles.formItem,
                          ...(isChecked ? styles.formItemChecked : {}),
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleForm(form.id)}
                          style={styles.checkbox}
                        />
                        <span style={styles.formIcon}>{form.icon}</span>
                        <span style={styles.formName}>{form.name}</span>
                        <span style={styles.formTime}>{form.time}</span>
                      </label>
                    );
                  })}
                </div>
              </>
            ) : (
              <>
                {/* Guide category filter */}
                <div style={styles.quickRow}>
                  {GUIDE_CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setGuideCategory(cat.id)}
                      style={{
                        ...styles.quickBtn,
                        ...(guideCategory === cat.id ? styles.quickBtnActive : {}),
                      }}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Select all / clear */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                  <button
                    onClick={() => {
                      const ids = filteredGuides.map(g => g.id);
                      setSelectedGuides(prev => {
                        const newSet = new Set(prev);
                        ids.forEach(id => newSet.add(id));
                        return [...newSet];
                      });
                    }}
                    style={styles.selectAllBtn}
                  >
                    Select All ({filteredGuides.length})
                  </button>
                  {selectedGuides.length > 0 && (
                    <button
                      onClick={() => setSelectedGuides([])}
                      style={styles.selectAllBtn}
                    >
                      Clear ({selectedGuides.length})
                    </button>
                  )}
                </div>

                {/* Guide grid */}
                <div style={styles.formGrid}>
                  {filteredGuides.map(guide => {
                    const isChecked = selectedGuides.includes(guide.id);
                    return (
                      <label
                        key={guide.id}
                        style={{
                          ...styles.formItem,
                          ...(isChecked ? styles.formItemChecked : {}),
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleGuide(guide.id)}
                          style={styles.checkbox}
                        />
                        <span style={styles.formIcon}>{guide.icon}</span>
                        <span style={styles.formName}>{guide.name}</span>
                      </label>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Step 3: Delivery Method */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <span style={styles.stepBadge}>3</span>
              <h3 style={styles.sectionTitle}>Send via</h3>
            </div>

            <div style={styles.deliveryToggle}>
              <button
                onClick={() => setDeliveryMethod('email')}
                style={{
                  ...styles.deliveryBtn,
                  ...(deliveryMethod === 'email' ? styles.deliveryBtnActive : {}),
                }}
              >
                📧 Email
              </button>
              <button
                onClick={() => setDeliveryMethod('sms')}
                style={{
                  ...styles.deliveryBtn,
                  ...(deliveryMethod === 'sms' ? styles.deliveryBtnActive : {}),
                }}
              >
                💬 SMS
              </button>
            </div>

            {/* Show destination */}
            {(mode === 'search' && selectedPatient) && (
              <div style={styles.destinationInfo}>
                {deliveryMethod === 'email' ? (
                  selectedPatient.email
                    ? <span>Sending to: <strong>{selectedPatient.email}</strong></span>
                    : <span style={styles.warningText}>No email on file for this patient</span>
                ) : (
                  selectedPatient.phone
                    ? <span>Sending to: <strong>{selectedPatient.phone}</strong></span>
                    : <span style={styles.warningText}>No phone on file for this patient</span>
                )}
              </div>
            )}

            {/* Blooio opt-in status indicator */}
            {deliveryMethod === 'sms' && blooioOptIn !== null && (
              <div style={{
                marginTop: '10px',
                padding: '8px 12px',
                borderRadius: 0,
                fontSize: '12px',
                fontWeight: '500',
                background: blooioOptIn ? '#f0fdf4' : '#fffbeb',
                color: blooioOptIn ? '#166534' : '#92400e',
                border: `1px solid ${blooioOptIn ? '#bbf7d0' : '#fde68a'}`,
              }}>
                {blooioOptIn
                  ? '✓ Blooio ready — links will send directly'
                  : '⚠ First contact — patient will need to reply before links deliver'
                }
              </div>
            )}
          </div>

          {/* Send button */}
          <div style={styles.sendSection}>
            <button
              onClick={handleSend}
              disabled={!canSend() || sending}
              style={{
                ...styles.sendBtn,
                opacity: !canSend() || sending ? 0.5 : 1,
              }}
            >
              {sending
                ? 'Sending...'
                : pageMode === 'questionnaire'
                  ? `Send Questionnaire via ${deliveryMethod === 'email' ? 'Email' : 'SMS'}`
                  : `Send ${selectedCount} ${selectedCount !== 1 ? itemLabelPlural : itemLabel} via ${deliveryMethod === 'email' ? 'Email' : 'SMS'}`
              }
            </button>

            {/* Result message */}
            {result && (
              <div style={{
                ...styles.resultMsg,
                background: result.success ? '#dcfce7' : '#fee2e2',
                color: result.success ? '#166534' : '#dc2626',
              }}>
                {result.success ? '✓' : '✕'} {result.message}
              </div>
            )}
          </div>
        </div>

        {/* Recent sends sidebar */}
        <div style={styles.recentCard}>
          <h3 style={styles.recentTitle}>Recent Sends</h3>
          {recentSends.length === 0 ? (
            <div style={styles.recentEmpty}>No sends this session</div>
          ) : (
            recentSends.map((send, i) => (
              <div key={i} style={styles.recentItem}>
                <div style={styles.recentName}>{send.name}</div>
                <div style={styles.recentMeta}>
                  {send.method === 'email' ? '📧' : '💬'} {send.type === 'questionnaire' ? 'questionnaire' : `${send.count} ${send.type === 'guides' ? 'guide' : 'form'}${send.count > 1 ? 's' : ''}`} · {send.time}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

const styles = {
  layout: {
    display: 'grid',
    gridTemplateColumns: '1fr 280px',
    gap: '20px',
    alignItems: 'start',
  },
  mainCard: {
    background: '#fff',
    borderRadius: 0,
    border: '1px solid #e5e5e5',
    overflow: 'hidden',
  },
  // Page mode bar (Forms / Guides toggle)
  pageModeBar: {
    display: 'flex',
    borderBottom: '1px solid #e5e5e5',
  },
  pageModeBtn: {
    flex: 1,
    padding: '14px',
    border: 'none',
    background: '#fafafa',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    color: '#999',
    fontFamily: 'inherit',
    borderBottom: '2px solid transparent',
    transition: 'all 0.15s',
  },
  pageModeBtnActive: {
    background: '#fff',
    color: '#000',
    borderBottom: '2px solid #000',
  },
  section: {
    padding: '24px',
    borderBottom: '1px solid #f0f0f0',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '16px',
  },
  stepBadge: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    background: '#000',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: '600',
    flexShrink: 0,
  },
  sectionTitle: {
    margin: 0,
    fontSize: '15px',
    fontWeight: '600',
  },
  // Mode toggle
  modeToggle: {
    display: 'flex',
    gap: '8px',
    marginBottom: '12px',
  },
  modeBtn: {
    padding: '6px 14px',
    border: '1px solid #ddd',
    borderRadius: 0,
    background: '#fff',
    fontSize: '13px',
    cursor: 'pointer',
    color: '#666',
    fontFamily: 'inherit',
  },
  modeBtnActive: {
    background: '#000',
    color: '#fff',
    borderColor: '#000',
  },
  // Input
  input: {
    width: '100%',
    padding: '10px 14px',
    border: '1px solid #ddd',
    borderRadius: 0,
    fontSize: '14px',
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  },
  manualFields: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  // Search dropdown
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    background: '#fff',
    border: '1px solid #ddd',
    borderRadius: 0,
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    zIndex: 10,
    maxHeight: '240px',
    overflowY: 'auto',
    marginTop: '4px',
  },
  dropdownItem: {
    padding: '10px 14px',
    cursor: 'pointer',
    borderBottom: '1px solid #f5f5f5',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownName: {
    fontWeight: '500',
    fontSize: '14px',
  },
  dropdownPhone: {
    fontSize: '12px',
    color: '#999',
  },
  // Selected patient
  selectedPatient: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    background: '#f9fafb',
    borderRadius: 0,
    border: '1px solid #e5e5e5',
  },
  selectedName: {
    fontWeight: '600',
    fontSize: '15px',
    marginBottom: '2px',
  },
  selectedDetail: {
    fontSize: '13px',
    color: '#666',
  },
  changeBtn: {
    padding: '6px 12px',
    border: '1px solid #ddd',
    borderRadius: 0,
    background: '#fff',
    fontSize: '12px',
    cursor: 'pointer',
    color: '#666',
    fontFamily: 'inherit',
  },
  // Quick selections / category filter
  quickRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    marginBottom: '14px',
  },
  quickBtn: {
    padding: '5px 12px',
    border: '1px solid #e5e5e5',
    borderRadius: 0,
    background: '#fff',
    fontSize: '12px',
    cursor: 'pointer',
    color: '#666',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap',
  },
  quickBtnActive: {
    background: '#000',
    color: '#fff',
    borderColor: '#000',
  },
  // Select all btn
  selectAllBtn: {
    padding: '4px 10px',
    border: '1px solid #ddd',
    borderRadius: 0,
    background: '#fff',
    fontSize: '11px',
    cursor: 'pointer',
    color: '#666',
    fontFamily: 'inherit',
  },
  // Form groups
  groupLabel: {
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
    color: '#999',
    letterSpacing: '0.5px',
    marginBottom: '8px',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    gap: '8px',
  },
  formItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 12px',
    border: '1px solid #e5e5e5',
    borderRadius: 0,
    cursor: 'pointer',
    background: '#fff',
    transition: 'all 0.1s',
  },
  formItemChecked: {
    background: '#f0fdf4',
    borderColor: '#86efac',
  },
  checkbox: {
    accentColor: '#000',
    width: '16px',
    height: '16px',
    cursor: 'pointer',
  },
  formIcon: {
    fontSize: '16px',
    flexShrink: 0,
  },
  formName: {
    flex: 1,
    fontSize: '13px',
    fontWeight: '500',
  },
  formTime: {
    fontSize: '11px',
    color: '#999',
    flexShrink: 0,
  },
  // Delivery method
  deliveryToggle: {
    display: 'flex',
    gap: '8px',
  },
  deliveryBtn: {
    padding: '10px 20px',
    border: '1px solid #ddd',
    borderRadius: 0,
    background: '#fff',
    fontSize: '14px',
    cursor: 'pointer',
    color: '#666',
    fontFamily: 'inherit',
    fontWeight: '500',
  },
  deliveryBtnActive: {
    background: '#000',
    color: '#fff',
    borderColor: '#000',
  },
  destinationInfo: {
    marginTop: '12px',
    fontSize: '13px',
    color: '#666',
  },
  warningText: {
    color: '#dc2626',
    fontSize: '13px',
  },
  // Send
  sendSection: {
    padding: '24px',
  },
  sendBtn: {
    width: '100%',
    padding: '14px',
    background: '#000',
    color: '#fff',
    border: 'none',
    borderRadius: 0,
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  resultMsg: {
    marginTop: '12px',
    padding: '10px 14px',
    borderRadius: 0,
    fontSize: '13px',
    fontWeight: '500',
  },
  // Recent sends
  recentCard: {
    background: '#fff',
    borderRadius: 0,
    border: '1px solid #e5e5e5',
    padding: '20px',
  },
  recentTitle: {
    margin: '0 0 14px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#333',
  },
  recentEmpty: {
    fontSize: '13px',
    color: '#999',
    textAlign: 'center',
    padding: '20px 0',
  },
  recentItem: {
    padding: '8px 0',
    borderBottom: '1px solid #f5f5f5',
  },
  recentName: {
    fontSize: '13px',
    fontWeight: '500',
    marginBottom: '2px',
  },
  recentMeta: {
    fontSize: '11px',
    color: '#999',
  },
  // Questionnaire
  questionnaireCard: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '16px',
    padding: '20px',
    background: '#f9fafb',
    borderRadius: 0,
    border: '1px solid #e5e5e5',
  },
  questionnaireIcon: {
    fontSize: '32px',
    flexShrink: 0,
  },
  questionnaireInfo: {
    flex: 1,
  },
  questionnaireName: {
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: '4px',
  },
  questionnaireMeta: {
    fontSize: '13px',
    color: '#666',
    marginBottom: '8px',
  },
  questionnaireDesc: {
    fontSize: '13px',
    color: '#888',
    lineHeight: '1.5',
  },
  copyLinkBtn: {
    padding: '8px 14px',
    border: '1px solid #ddd',
    borderRadius: 0,
    background: '#fff',
    fontSize: '13px',
    cursor: 'pointer',
    color: '#333',
    fontFamily: 'inherit',
    fontWeight: '500',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
};
