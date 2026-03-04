// /pages/admin/send-forms.js
// Standalone Send Forms page — send consent/form links via SMS or Email
// Range Medical System V2

import { useState, useRef } from 'react';
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
];

export default function SendFormsPage() {
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

  // Delivery method
  const [deliveryMethod, setDeliveryMethod] = useState('email'); // 'sms' | 'email'

  // Status
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [recentSends, setRecentSends] = useState([]);

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
    // Fetch full patient details to get phone and email
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

  const applyQuickSelect = (forms) => {
    setSelectedForms(forms);
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

  const canSend = () => {
    if (selectedForms.length === 0) return false;
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
      if (deliveryMethod === 'email') {
        const email = mode === 'search' ? selectedPatient.email : manualEmail;
        const res = await fetch('/api/admin/send-forms-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            firstName: firstName || null,
            formIds: selectedForms,
            patientId: patient?.id || null,
            patientName: patient?.name || manualName || null,
            ghlContactId: patient?.ghl_contact_id || null,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to send email');

        setResult({ success: true, message: `${selectedForms.length} form${selectedForms.length > 1 ? 's' : ''} sent via email` });
        addRecentSend(patient?.name || manualName || email, 'email', selectedForms.length);
      } else {
        const phone = mode === 'search' ? selectedPatient.phone : manualPhone;
        const digits = phone.replace(/\D/g, '');
        const res = await fetch('/api/send-forms-sms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits,
            firstName: firstName || null,
            formIds: selectedForms,
            patientId: patient?.id || null,
            patientName: patient?.name || manualName || null,
            ghlContactId: patient?.ghl_contact_id || null,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to send SMS');

        setResult({ success: true, message: `${selectedForms.length} form${selectedForms.length > 1 ? 's' : ''} sent via SMS` });
        addRecentSend(patient?.name || manualName || phone, 'sms', selectedForms.length);
      }

      // Reset form selection after success
      setSelectedForms([]);
    } catch (err) {
      setResult({ success: false, message: err.message });
    } finally {
      setSending(false);
    }
  };

  const addRecentSend = (name, method, count) => {
    setRecentSends(prev => [
      { name, method, count, time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) },
      ...prev.slice(0, 9),
    ]);
  };

  const formatPhone = (value) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  return (
    <AdminLayout title="Send Forms">
      <div style={styles.layout}>
        {/* Main form area */}
        <div style={styles.mainCard}>

          {/* Step 1: Patient */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <span style={styles.stepBadge}>1</span>
              <h3 style={styles.sectionTitle}>Patient</h3>
            </div>

            {/* Mode toggle */}
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

            {mode === 'search' ? (
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

          {/* Step 2: Select Forms */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <span style={styles.stepBadge}>2</span>
              <h3 style={styles.sectionTitle}>Select Forms</h3>
            </div>

            {/* Quick selections */}
            <div style={styles.quickRow}>
              {QUICK_SELECTIONS.map(qs => (
                <button
                  key={qs.label}
                  onClick={() => applyQuickSelect(qs.forms)}
                  style={{
                    ...styles.quickBtn,
                    ...(JSON.stringify(selectedForms.sort()) === JSON.stringify([...qs.forms].sort())
                      ? styles.quickBtnActive : {}),
                  }}
                >
                  {qs.label}
                </button>
              ))}
            </div>

            {/* Form checkboxes */}
            <div style={styles.formGrid}>
              {AVAILABLE_FORMS.map(form => {
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
              {sending ? 'Sending...' : `Send ${selectedForms.length} Form${selectedForms.length !== 1 ? 's' : ''} via ${deliveryMethod === 'email' ? 'Email' : 'SMS'}`}
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
                  {send.method === 'email' ? '📧' : '💬'} {send.count} form{send.count > 1 ? 's' : ''} · {send.time}
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
    borderRadius: '12px',
    border: '1px solid #e5e5e5',
    overflow: 'hidden',
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
    borderRadius: '6px',
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
    borderRadius: '8px',
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
    borderRadius: '8px',
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
    borderRadius: '8px',
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
    borderRadius: '6px',
    background: '#fff',
    fontSize: '12px',
    cursor: 'pointer',
    color: '#666',
    fontFamily: 'inherit',
  },
  // Quick selections
  quickRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    marginBottom: '14px',
  },
  quickBtn: {
    padding: '5px 12px',
    border: '1px solid #e5e5e5',
    borderRadius: '16px',
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
  // Form grid
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
    borderRadius: '8px',
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
    borderRadius: '8px',
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
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  resultMsg: {
    marginTop: '12px',
    padding: '10px 14px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '500',
  },
  // Recent sends
  recentCard: {
    background: '#fff',
    borderRadius: '12px',
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
};
