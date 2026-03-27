// /pages/check-in.jsx
// iPad check-in kiosk — staff searches/enters patient, picks forms, hands iPad to patient
// Range Medical

import { useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

const AVAILABLE_FORMS = [
  { id: 'intake', name: 'Medical Intake', time: '10 min', required: true },
  { id: 'hipaa', name: 'HIPAA Privacy Notice', time: '3 min', required: true },
  { id: 'blood-draw', name: 'Blood Draw Consent', time: '2 min' },
  { id: 'hrt', name: 'HRT Consent', time: '5 min' },
  { id: 'peptide', name: 'Peptide Therapy Consent', time: '5 min' },
  { id: 'iv', name: 'IV & Injection Consent', time: '5 min' },
  { id: 'hbot', name: 'HBOT Consent', time: '5 min' },
  { id: 'weight-loss', name: 'Weight Loss Consent', time: '5 min' },
  { id: 'red-light', name: 'Red Light Therapy', time: '5 min' },
  { id: 'prp', name: 'PRP Consent', time: '5 min' },
  { id: 'exosome-iv', name: 'Exosome IV Consent', time: '5 min' },
  { id: 'questionnaire', name: 'Baseline Questionnaire', time: '10 min' },
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
  { label: 'Labs + Questionnaire', forms: ['intake', 'hipaa', 'blood-draw', 'questionnaire'] },
];

export default function CheckInPage() {
  const router = useRouter();

  // Step tracking
  const [step, setStep] = useState('patient'); // 'patient' | 'forms' | 'launching'

  // Patient info
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [manualFirst, setManualFirst] = useState('');
  const [manualLast, setManualLast] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [inputMode, setInputMode] = useState('search'); // 'search' | 'manual'
  const searchTimeout = useRef(null);

  // Form selection
  const [selectedForms, setSelectedForms] = useState([]);

  // Error state
  const [error, setError] = useState(null);

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
        lastName: p.last_name || (p.name || '').split(' ').slice(1).join(' '),
        phone: p.phone || '',
        email: p.email || '',
      });
    } catch {
      setSelectedPatient({
        id: patient.id,
        name: patient.first_name && patient.last_name ? `${patient.first_name} ${patient.last_name}` : patient.name,
        firstName: patient.first_name || (patient.name || '').split(' ')[0],
        lastName: patient.last_name || (patient.name || '').split(' ').slice(1).join(' '),
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

  const applyPreset = (forms) => {
    setSelectedForms(forms);
  };

  const canProceedToForms = () => {
    if (inputMode === 'search') return !!selectedPatient;
    return manualFirst.trim() && manualLast.trim();
  };

  const canLaunch = () => selectedForms.length > 0;

  const handleLaunch = async () => {
    setStep('launching');
    setError(null);

    const patientName = inputMode === 'search'
      ? selectedPatient.name
      : `${manualFirst.trim()} ${manualLast.trim()}`;
    const patientId = inputMode === 'search' ? selectedPatient.id : null;
    const patientEmail = inputMode === 'search' ? selectedPatient.email : manualEmail.trim();
    const patientPhone = inputMode === 'search' ? selectedPatient.phone : manualPhone.trim();

    // Sort: intake first, hipaa second
    const PRIORITY = ['intake', 'hipaa'];
    const sorted = [...selectedForms].sort((a, b) => {
      const aIdx = PRIORITY.indexOf(a);
      const bIdx = PRIORITY.indexOf(b);
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      if (aIdx !== -1) return -1;
      if (bIdx !== -1) return 1;
      return 0;
    });

    try {
      const res = await fetch('/api/check-in/create-bundle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formIds: sorted,
          patientId,
          patientName,
          patientEmail: patientEmail || null,
          patientPhone: patientPhone || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create form bundle');

      // Redirect to form bundle in kiosk mode
      router.push(`/forms/${data.token}?kiosk=1`);
    } catch (err) {
      console.error('Launch error:', err);
      setError(err.message);
      setStep('forms');
    }
  };

  const resetAll = () => {
    setStep('patient');
    setSelectedPatient(null);
    setSearchQuery('');
    setSearchResults([]);
    setManualFirst('');
    setManualLast('');
    setManualEmail('');
    setManualPhone('');
    setSelectedForms([]);
    setInputMode('search');
    setError(null);
  };

  return (
    <>
      <Head>
        <title>Patient Check-In | Range Medical</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </Head>
      <div style={styles.page}>
        <div style={styles.container}>
          {/* Header */}
          <div style={styles.header}>
            <h1 style={styles.logo}>RANGE MEDICAL</h1>
            <p style={styles.headerSub}>Patient Check-In</p>
          </div>

          <div style={styles.body}>
            {/* Step 1: Patient */}
            {step === 'patient' && (
              <>
                <h2 style={styles.stepTitle}>Who is checking in?</h2>

                {/* Toggle: Search vs New */}
                <div style={styles.toggleRow}>
                  <button
                    style={inputMode === 'search' ? styles.toggleActive : styles.toggleInactive}
                    onClick={() => { setInputMode('search'); setSelectedPatient(null); }}
                  >
                    Existing Patient
                  </button>
                  <button
                    style={inputMode === 'manual' ? styles.toggleActive : styles.toggleInactive}
                    onClick={() => { setInputMode('manual'); setSelectedPatient(null); setSearchResults([]); setSearchQuery(''); }}
                  >
                    New Patient
                  </button>
                </div>

                {inputMode === 'search' ? (
                  <div style={styles.searchSection}>
                    <input
                      type="text"
                      placeholder="Search by name, email, or phone..."
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      style={styles.searchInput}
                      autoFocus
                    />

                    {searchResults.length > 0 && (
                      <div style={styles.searchResults}>
                        {searchResults.map(p => (
                          <button
                            key={p.id}
                            style={styles.searchResultItem}
                            onClick={() => selectPatient(p)}
                          >
                            <span style={styles.resultName}>
                              {p.first_name && p.last_name ? `${p.first_name} ${p.last_name}` : p.name}
                            </span>
                            <span style={styles.resultDetail}>
                              {p.email || p.phone || ''}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    {selectedPatient && (
                      <div style={styles.selectedCard}>
                        <div style={styles.selectedIcon}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                          </svg>
                        </div>
                        <div>
                          <div style={styles.selectedName}>{selectedPatient.name}</div>
                          <div style={styles.selectedMeta}>
                            {selectedPatient.email && <span>{selectedPatient.email}</span>}
                            {selectedPatient.email && selectedPatient.phone && <span> &bull; </span>}
                            {selectedPatient.phone && <span>{selectedPatient.phone}</span>}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={styles.manualSection}>
                    <div style={styles.nameRow}>
                      <input
                        type="text"
                        placeholder="First Name *"
                        value={manualFirst}
                        onChange={(e) => setManualFirst(e.target.value)}
                        style={styles.halfInput}
                        autoFocus
                      />
                      <input
                        type="text"
                        placeholder="Last Name *"
                        value={manualLast}
                        onChange={(e) => setManualLast(e.target.value)}
                        style={styles.halfInput}
                      />
                    </div>
                    <input
                      type="email"
                      placeholder="Email (optional)"
                      value={manualEmail}
                      onChange={(e) => setManualEmail(e.target.value)}
                      style={styles.fullInput}
                    />
                    <input
                      type="tel"
                      placeholder="Phone (optional)"
                      value={manualPhone}
                      onChange={(e) => setManualPhone(e.target.value)}
                      style={styles.fullInput}
                    />
                  </div>
                )}

                <button
                  style={canProceedToForms() ? styles.primaryButton : styles.primaryButtonDisabled}
                  disabled={!canProceedToForms()}
                  onClick={() => setStep('forms')}
                >
                  Next: Select Forms
                </button>
              </>
            )}

            {/* Step 2: Form Selection */}
            {step === 'forms' && (
              <>
                <div style={styles.backRow}>
                  <button style={styles.backButton} onClick={() => setStep('patient')}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                    Back
                  </button>
                  <span style={styles.patientLabel}>
                    {inputMode === 'search'
                      ? selectedPatient?.name
                      : `${manualFirst} ${manualLast}`}
                  </span>
                </div>

                <h2 style={styles.stepTitle}>Select Forms</h2>

                {error && (
                  <div style={styles.errorBanner}>{error}</div>
                )}

                {/* Quick presets */}
                <div style={styles.presetsRow}>
                  {QUICK_SELECTIONS.map(preset => (
                    <button
                      key={preset.label}
                      style={
                        JSON.stringify(selectedForms.sort()) === JSON.stringify([...preset.forms].sort())
                          ? styles.presetActive
                          : styles.preset
                      }
                      onClick={() => applyPreset(preset.forms)}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {/* Individual forms */}
                <div style={styles.formsList}>
                  {AVAILABLE_FORMS.map(form => {
                    const isSelected = selectedForms.includes(form.id);
                    return (
                      <button
                        key={form.id}
                        style={isSelected ? styles.formItemSelected : styles.formItem}
                        onClick={() => toggleForm(form.id)}
                      >
                        <div style={isSelected ? styles.checkbox : styles.checkboxEmpty}>
                          {isSelected && (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </div>
                        <span style={styles.formName}>{form.name}</span>
                        <span style={styles.formTime}>{form.time}</span>
                      </button>
                    );
                  })}
                </div>

                <button
                  style={canLaunch() ? styles.launchButton : styles.launchButtonDisabled}
                  disabled={!canLaunch()}
                  onClick={handleLaunch}
                >
                  Hand iPad to Patient ({selectedForms.length} form{selectedForms.length !== 1 ? 's' : ''})
                </button>
              </>
            )}

            {/* Launching state */}
            {step === 'launching' && (
              <div style={styles.launchingSection}>
                <div style={styles.spinner} />
                <p style={styles.launchingText}>Setting up forms...</p>
                <style jsx global>{`
                  @keyframes spin { to { transform: rotate(360deg); } }
                `}</style>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#f5f5f5',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: '24px 16px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  container: {
    width: '100%',
    maxWidth: '600px',
    background: '#fff',
    overflow: 'hidden',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
  },
  header: {
    background: '#000',
    padding: '20px 24px',
    textAlign: 'center',
  },
  logo: {
    margin: 0,
    color: '#fff',
    fontSize: '18px',
    fontWeight: 700,
    letterSpacing: '3px',
  },
  headerSub: {
    margin: '6px 0 0',
    color: '#a3a3a3',
    fontSize: '13px',
  },
  body: {
    padding: '28px 24px',
  },
  stepTitle: {
    margin: '0 0 20px',
    fontSize: '20px',
    fontWeight: 700,
    color: '#111',
  },

  // Toggle
  toggleRow: {
    display: 'flex',
    gap: '0',
    marginBottom: '20px',
    border: '1px solid #e5e5e5',
    overflow: 'hidden',
  },
  toggleActive: {
    flex: 1,
    padding: '12px',
    fontSize: '14px',
    fontWeight: 600,
    background: '#000',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
  },
  toggleInactive: {
    flex: 1,
    padding: '12px',
    fontSize: '14px',
    fontWeight: 500,
    background: '#fff',
    color: '#666',
    border: 'none',
    cursor: 'pointer',
  },

  // Search
  searchSection: {
    marginBottom: '24px',
  },
  searchInput: {
    width: '100%',
    padding: '14px 16px',
    fontSize: '16px',
    border: '1px solid #ddd',
    outline: 'none',
    boxSizing: 'border-box',
    background: '#fafafa',
  },
  searchResults: {
    border: '1px solid #e5e5e5',
    borderTop: 'none',
    maxHeight: '240px',
    overflowY: 'auto',
  },
  searchResultItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    width: '100%',
    padding: '14px 16px',
    background: '#fff',
    border: 'none',
    borderBottom: '1px solid #f0f0f0',
    cursor: 'pointer',
    textAlign: 'left',
  },
  resultName: {
    fontSize: '15px',
    fontWeight: 600,
    color: '#111',
  },
  resultDetail: {
    fontSize: '13px',
    color: '#999',
    marginTop: '2px',
  },

  // Selected patient
  selectedCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    background: '#f0fdf4',
    border: '1px solid #bbf7d0',
    marginTop: '12px',
  },
  selectedIcon: {
    flexShrink: 0,
  },
  selectedName: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#111',
  },
  selectedMeta: {
    fontSize: '13px',
    color: '#666',
    marginTop: '2px',
  },

  // Manual entry
  manualSection: {
    marginBottom: '24px',
  },
  nameRow: {
    display: 'flex',
    gap: '12px',
    marginBottom: '12px',
  },
  halfInput: {
    flex: 1,
    padding: '14px 16px',
    fontSize: '16px',
    border: '1px solid #ddd',
    outline: 'none',
    boxSizing: 'border-box',
    background: '#fafafa',
  },
  fullInput: {
    width: '100%',
    padding: '14px 16px',
    fontSize: '16px',
    border: '1px solid #ddd',
    outline: 'none',
    boxSizing: 'border-box',
    background: '#fafafa',
    marginBottom: '12px',
  },

  // Primary button
  primaryButton: {
    width: '100%',
    padding: '16px',
    fontSize: '16px',
    fontWeight: 700,
    background: '#000',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    letterSpacing: '0.5px',
  },
  primaryButtonDisabled: {
    width: '100%',
    padding: '16px',
    fontSize: '16px',
    fontWeight: 700,
    background: '#ccc',
    color: '#fff',
    border: 'none',
    cursor: 'not-allowed',
    letterSpacing: '0.5px',
  },

  // Back row
  backRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '20px',
  },
  backButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '8px 12px',
    fontSize: '14px',
    color: '#666',
    background: '#f5f5f5',
    border: 'none',
    cursor: 'pointer',
  },
  patientLabel: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#111',
  },

  // Presets
  presetsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginBottom: '20px',
  },
  preset: {
    padding: '8px 14px',
    fontSize: '13px',
    fontWeight: 500,
    background: '#f5f5f5',
    color: '#333',
    border: '1px solid #e5e5e5',
    cursor: 'pointer',
  },
  presetActive: {
    padding: '8px 14px',
    fontSize: '13px',
    fontWeight: 600,
    background: '#000',
    color: '#fff',
    border: '1px solid #000',
    cursor: 'pointer',
  },

  // Forms list
  formsList: {
    marginBottom: '24px',
  },
  formItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '100%',
    padding: '14px 16px',
    background: '#fafafa',
    border: '1px solid #eee',
    borderBottom: 'none',
    cursor: 'pointer',
    textAlign: 'left',
  },
  formItemSelected: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '100%',
    padding: '14px 16px',
    background: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderBottom: 'none',
    cursor: 'pointer',
    textAlign: 'left',
  },
  checkbox: {
    width: '24px',
    height: '24px',
    background: '#22c55e',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkboxEmpty: {
    width: '24px',
    height: '24px',
    border: '2px solid #ccc',
    background: '#fff',
    flexShrink: 0,
  },
  formName: {
    flex: 1,
    fontSize: '15px',
    fontWeight: 500,
    color: '#111',
  },
  formTime: {
    fontSize: '13px',
    color: '#999',
    flexShrink: 0,
  },

  // Launch button
  launchButton: {
    width: '100%',
    padding: '18px',
    fontSize: '17px',
    fontWeight: 700,
    background: '#22c55e',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    letterSpacing: '0.5px',
  },
  launchButtonDisabled: {
    width: '100%',
    padding: '18px',
    fontSize: '17px',
    fontWeight: 700,
    background: '#ccc',
    color: '#fff',
    border: 'none',
    cursor: 'not-allowed',
    letterSpacing: '0.5px',
  },

  // Launching
  launchingSection: {
    textAlign: 'center',
    padding: '40px 0',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid #e5e5e5',
    borderTopColor: '#000',
    borderRadius: '50%',
    margin: '0 auto 16px',
    animation: 'spin 0.8s linear infinite',
  },
  launchingText: {
    fontSize: '15px',
    color: '#666',
  },

  // Error
  errorBanner: {
    padding: '12px 16px',
    background: '#fef2f2',
    color: '#dc2626',
    fontSize: '14px',
    marginBottom: '16px',
    border: '1px solid #fecaca',
  },
};
