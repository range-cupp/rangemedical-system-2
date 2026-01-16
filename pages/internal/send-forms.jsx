import Head from 'next/head';
import { useState, useEffect } from 'react';

const AVAILABLE_FORMS = [
  { id: 'intake', name: 'Medical Intake', path: '/intake', icon: '📋', time: '10 min', required: true },
  { id: 'hipaa', name: 'HIPAA Privacy Notice', path: '/consent/hipaa', icon: '🔒', time: '3 min', required: true },
  { id: 'blood-draw', name: 'Blood Draw Consent', path: '/consent/blood-draw', icon: '🩸', time: '2 min' },
  { id: 'hrt', name: 'HRT Consent', path: '/consent/hrt', icon: '💊', time: '5 min' },
  { id: 'peptide', name: 'Peptide Therapy Consent', path: '/consent/peptide', icon: '🧬', time: '5 min' },
  { id: 'iv', name: 'IV & Injection Consent', path: '/consent/iv', icon: '💧', time: '5 min' },
  { id: 'hbot', name: 'HBOT Consent', path: '/consent/hbot', icon: '🫁', time: '5 min' },
  { id: 'weight-loss', name: 'Weight Loss Consent', path: '/consent/weight-loss', icon: '⚖️', time: '5 min' },
  { id: 'red-light', name: 'Red Light Therapy', path: '/consent/red-light', icon: '🔴', time: '5 min' },
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

export default function SendForms() {
  const [entryMode, setEntryMode] = useState('search'); // 'search' or 'manual'
  const [patients, setPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loadingPatients, setLoadingPatients] = useState(false);
  
  const [phone, setPhone] = useState('');
  const [firstName, setFirstName] = useState('');
  const [selectedForms, setSelectedForms] = useState(['intake', 'hipaa']);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [recentSends, setRecentSends] = useState([]);

  // Fetch patients on mount
  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    setLoadingPatients(true);
    try {
      const res = await fetch('/api/patients?limit=1000');
      if (res.ok) {
        const data = await res.json();
        setPatients(data.patients || []);
      }
    } catch (err) {
      console.error('Error fetching patients:', err);
    } finally {
      setLoadingPatients(false);
    }
  };

  // Filter patients based on search
  const filteredPatients = patients.filter(p => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      p.name?.toLowerCase().includes(query) ||
      p.email?.toLowerCase().includes(query) ||
      p.phone?.includes(query)
    );
  }).slice(0, 20); // Limit to 20 results

  const formatPhone = (value) => {
    if (!value) return '';
    let digits = value.replace(/\D/g, '');
    // Strip leading 1 (US country code) if present
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
    setSearchQuery(patient.name);
    setShowDropdown(false);
    // Auto-fill phone and name
    if (patient.phone) {
      setPhone(formatPhone(patient.phone));
    }
    if (patient.name) {
      const nameParts = patient.name.split(' ');
      setFirstName(nameParts[0] || '');
    }
  };

  const clearPatient = () => {
    setSelectedPatient(null);
    setSearchQuery('');
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

  const selectAll = () => {
    setSelectedForms(AVAILABLE_FORMS.map(f => f.id));
  };

  const clearAll = () => {
    setSelectedForms([]);
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
        
        // Reset form
        setPhone('');
        setFirstName('');
        setSelectedPatient(null);
        setSearchQuery('');
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
    <>
      <Head>
        <title>Send Patient Forms | Range Medical Staff</title>
        <meta name="robots" content="noindex, nofollow" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <style jsx global>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
          background: #f5f5f5;
          min-height: 100vh;
        }
      `}</style>

      <style jsx>{`
        .page {
          max-width: 600px;
          margin: 0 auto;
          padding: 2rem 1.5rem;
        }
        .header {
          text-align: center;
          margin-bottom: 2rem;
          padding-bottom: 1.5rem;
          border-bottom: 2px solid #000;
        }
        .logo {
          font-size: 1.75rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          margin-bottom: 0.25rem;
        }
        .subtitle {
          color: #525252;
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .card {
          background: #fff;
          border: 2px solid #000;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }
        .card-title {
          font-size: 1rem;
          font-weight: 700;
          margin-bottom: 1rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .mode-toggle {
          display: flex;
          gap: 0;
          margin-bottom: 1.25rem;
          border: 2px solid #000;
        }
        .mode-btn {
          flex: 1;
          padding: 0.75rem 1rem;
          font-size: 0.875rem;
          font-weight: 600;
          border: none;
          background: #fff;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.15s;
        }
        .mode-btn:first-child {
          border-right: 1px solid #000;
        }
        .mode-btn:last-child {
          border-left: 1px solid #000;
        }
        .mode-btn.active {
          background: #000;
          color: #fff;
        }
        .mode-btn:hover:not(.active) {
          background: #f5f5f5;
        }
        .form-group {
          margin-bottom: 1rem;
        }
        .label {
          display: block;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.5rem;
          color: #404040;
        }
        .input {
          width: 100%;
          padding: 0.875rem 1rem;
          font-size: 1rem;
          font-family: inherit;
          border: 2px solid #d4d4d4;
          background: #fff;
          transition: border-color 0.2s;
        }
        .input:focus {
          outline: none;
          border-color: #000;
        }
        .input-phone {
          font-size: 1.5rem;
          letter-spacing: 0.025em;
          text-align: center;
        }
        .search-container {
          position: relative;
        }
        .search-input {
          width: 100%;
          padding: 0.875rem 1rem;
          padding-right: 40px;
          font-size: 1rem;
          font-family: inherit;
          border: 2px solid #d4d4d4;
          background: #fff;
          transition: border-color 0.2s;
        }
        .search-input:focus {
          outline: none;
          border-color: #000;
        }
        .clear-btn {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          background: #e5e5e5;
          border: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .clear-btn:hover {
          background: #d4d4d4;
        }
        .dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: #fff;
          border: 2px solid #000;
          border-top: none;
          max-height: 300px;
          overflow-y: auto;
          z-index: 100;
        }
        .dropdown-item {
          padding: 0.75rem 1rem;
          cursor: pointer;
          border-bottom: 1px solid #e5e5e5;
          transition: background 0.1s;
        }
        .dropdown-item:last-child {
          border-bottom: none;
        }
        .dropdown-item:hover {
          background: #f5f5f5;
        }
        .dropdown-item.selected {
          background: #000;
          color: #fff;
        }
        .dropdown-name {
          font-weight: 600;
          font-size: 0.9375rem;
        }
        .dropdown-details {
          font-size: 0.8125rem;
          color: #737373;
          margin-top: 2px;
        }
        .dropdown-item.selected .dropdown-details {
          color: #a3a3a3;
        }
        .dropdown-empty {
          padding: 1rem;
          text-align: center;
          color: #737373;
          font-size: 0.875rem;
        }
        .selected-patient {
          background: #f0fdf4;
          border: 2px solid #16a34a;
          padding: 1rem;
          margin-bottom: 1rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .selected-patient-info {
          flex: 1;
        }
        .selected-patient-name {
          font-weight: 700;
          font-size: 1rem;
          color: #166534;
        }
        .selected-patient-phone {
          font-size: 0.875rem;
          color: #15803d;
        }
        .selected-patient-clear {
          background: none;
          border: none;
          color: #dc2626;
          cursor: pointer;
          font-size: 0.875rem;
          text-decoration: underline;
        }
        .quick-btns {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }
        .quick-btn {
          padding: 0.5rem 0.75rem;
          font-size: 0.75rem;
          font-weight: 600;
          border: 1.5px solid #d4d4d4;
          background: #fff;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.15s;
        }
        .quick-btn:hover {
          border-color: #000;
          background: #f5f5f5;
        }
        .quick-btn.active {
          border-color: #000;
          background: #000;
          color: #fff;
        }
        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
        }
        .form-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          border: 1.5px solid #e5e5e5;
          cursor: pointer;
          transition: all 0.15s;
          user-select: none;
        }
        .form-item:hover {
          border-color: #a3a3a3;
        }
        .form-item.selected {
          border-color: #000;
          background: #f5f5f5;
        }
        .form-item input {
          display: none;
        }
        .form-checkbox {
          width: 20px;
          height: 20px;
          border: 2px solid #d4d4d4;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          font-size: 0.75rem;
        }
        .form-item.selected .form-checkbox {
          background: #000;
          border-color: #000;
          color: #fff;
        }
        .form-icon {
          font-size: 1.25rem;
        }
        .form-info {
          flex: 1;
          min-width: 0;
        }
        .form-name {
          font-size: 0.8125rem;
          font-weight: 600;
          line-height: 1.3;
        }
        .form-time {
          font-size: 0.6875rem;
          color: #737373;
        }
        .selection-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid #e5e5e5;
        }
        .selection-count {
          font-size: 0.875rem;
          color: #525252;
        }
        .selection-count strong {
          color: #000;
        }
        .text-btn {
          font-size: 0.75rem;
          color: #525252;
          background: none;
          border: none;
          cursor: pointer;
          text-decoration: underline;
          font-family: inherit;
        }
        .text-btn:hover {
          color: #000;
        }
        .btn {
          width: 100%;
          padding: 1rem;
          font-size: 1rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          border: 2px solid #000;
          background: #000;
          color: #fff;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s;
        }
        .btn:hover:not(:disabled) {
          background: #fff;
          color: #000;
        }
        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .status {
          margin-top: 1rem;
          padding: 1rem;
          text-align: center;
          font-weight: 500;
        }
        .status-error {
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #dc2626;
        }
        .status-success {
          background: #f0fdf4;
          color: #16a34a;
          border: 1px solid #16a34a;
        }
        .status-loading {
          background: #f5f5f5;
          color: #525252;
          border: 1px solid #d4d4d4;
        }
        .recent {
          margin-top: 1.5rem;
        }
        .recent-title {
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #737373;
          margin-bottom: 0.75rem;
        }
        .recent-list {
          list-style: none;
        }
        .recent-item {
          padding: 0.75rem 0;
          border-bottom: 1px solid #e5e5e5;
          font-size: 0.875rem;
        }
        .recent-item:last-child {
          border-bottom: none;
        }
        .recent-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.25rem;
        }
        .recent-name {
          font-weight: 600;
        }
        .recent-phone {
          color: #525252;
        }
        .recent-time {
          color: #a3a3a3;
          font-size: 0.75rem;
        }
        .recent-forms {
          font-size: 0.75rem;
          color: #737373;
        }
        @media (max-width: 500px) {
          .form-grid {
            grid-template-columns: 1fr;
          }
          .quick-btns {
            justify-content: center;
          }
        }
      `}</style>

      <div className="page">
        <div className="header">
          <div className="logo">RANGE MEDICAL</div>
          <div className="subtitle">Staff Portal</div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Patient Info */}
          <div className="card">
            <h2 className="card-title">Patient Information</h2>
            
            {/* Mode Toggle */}
            <div className="mode-toggle">
              <button 
                type="button"
                className={`mode-btn ${entryMode === 'search' ? 'active' : ''}`}
                onClick={() => { setEntryMode('search'); clearPatient(); }}
              >
                🔍 Search Patient
              </button>
              <button 
                type="button"
                className={`mode-btn ${entryMode === 'manual' ? 'active' : ''}`}
                onClick={() => { setEntryMode('manual'); clearPatient(); }}
              >
                ✏️ Enter Manually
              </button>
            </div>

            {entryMode === 'search' && (
              <>
                {selectedPatient ? (
                  <div className="selected-patient">
                    <div className="selected-patient-info">
                      <div className="selected-patient-name">✓ {selectedPatient.name}</div>
                      <div className="selected-patient-phone">{formatPhone(selectedPatient.phone) || selectedPatient.email || 'No contact info'}</div>
                    </div>
                    <button type="button" className="selected-patient-clear" onClick={clearPatient}>
                      Change
                    </button>
                  </div>
                ) : (
                  <div className="form-group">
                    <label className="label">Search by Name, Email, or Phone</label>
                    <div className="search-container">
                      <input
                        type="text"
                        className="search-input"
                        placeholder={loadingPatients ? 'Loading patients...' : 'Start typing patient name...'}
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setShowDropdown(true);
                        }}
                        onFocus={() => setShowDropdown(true)}
                        disabled={loadingPatients}
                      />
                      {searchQuery && (
                        <button type="button" className="clear-btn" onClick={() => { setSearchQuery(''); setShowDropdown(false); }}>
                          ×
                        </button>
                      )}
                      {showDropdown && searchQuery && (
                        <div className="dropdown">
                          {filteredPatients.length === 0 ? (
                            <div className="dropdown-empty">No patients found</div>
                          ) : (
                            filteredPatients.map(patient => (
                              <div
                                key={patient.id}
                                className="dropdown-item"
                                onClick={() => selectPatient(patient)}
                              >
                                <div className="dropdown-name">{patient.name}</div>
                                <div className="dropdown-details">
                                  {patient.phone && formatPhone(patient.phone)}
                                  {patient.phone && patient.email && ' • '}
                                  {patient.email}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Phone override for search mode */}
                {selectedPatient && (
                  <div className="form-group">
                    <label className="label">Phone Number (editable)</label>
                    <input
                      type="tel"
                      className="input"
                      placeholder="(555) 555-5555"
                      value={phone}
                      onChange={handlePhoneChange}
                      maxLength={14}
                      required
                    />
                  </div>
                )}
              </>
            )}

            {entryMode === 'manual' && (
              <>
                <div className="form-group">
                  <label className="label">Phone Number *</label>
                  <input
                    type="tel"
                    className="input input-phone"
                    placeholder="(555) 555-5555"
                    value={phone}
                    onChange={handlePhoneChange}
                    maxLength={14}
                    required
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label className="label">First Name (optional)</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="For personalized message"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>

          {/* Form Selection */}
          <div className="card">
            <h2 className="card-title">Select Forms to Send</h2>
            
            <div className="quick-btns">
              {QUICK_SELECTIONS.map(qs => (
                <button
                  key={qs.label}
                  type="button"
                  className={`quick-btn ${JSON.stringify(selectedForms.sort()) === JSON.stringify(qs.forms.sort()) ? 'active' : ''}`}
                  onClick={() => applyQuickSelection(qs.forms)}
                >
                  {qs.label}
                </button>
              ))}
            </div>

            <div className="form-grid">
              {AVAILABLE_FORMS.map(form => (
                <label 
                  key={form.id} 
                  className={`form-item ${selectedForms.includes(form.id) ? 'selected' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={selectedForms.includes(form.id)}
                    onChange={() => toggleForm(form.id)}
                  />
                  <div className="form-checkbox">
                    {selectedForms.includes(form.id) && '✓'}
                  </div>
                  <span className="form-icon">{form.icon}</span>
                  <div className="form-info">
                    <div className="form-name">{form.name}</div>
                    <div className="form-time">{form.time}</div>
                  </div>
                </label>
              ))}
            </div>

            <div className="selection-actions">
              <span className="selection-count">
                <strong>{selectedForms.length}</strong> form{selectedForms.length !== 1 ? 's' : ''} selected
              </span>
              <div>
                <button type="button" className="text-btn" onClick={selectAll}>Select All</button>
                {' • '}
                <button type="button" className="text-btn" onClick={clearAll}>Clear</button>
              </div>
            </div>
          </div>

          {/* Submit */}
          <button 
            type="submit" 
            className="btn" 
            disabled={loading || selectedForms.length === 0 || !phone}
          >
            {loading ? 'Sending...' : `Send ${selectedForms.length} Form${selectedForms.length !== 1 ? 's' : ''}`}
          </button>

          {status.message && (
            <div className={`status status-${status.type}`}>
              {status.message}
            </div>
          )}
        </form>

        {/* Recent Sends */}
        {recentSends.length > 0 && (
          <div className="recent">
            <div className="recent-title">Recently Sent</div>
            <ul className="recent-list">
              {recentSends.map((send, i) => (
                <li key={i} className="recent-item">
                  <div className="recent-top">
                    <div>
                      <span className="recent-name">{send.firstName}</span>
                      <span className="recent-phone"> • {send.phone}</span>
                    </div>
                    <span className="recent-time">{send.time}</span>
                  </div>
                  <div className="recent-forms">{send.count} form(s): {send.forms}</div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </>
  );
}
