import { useState } from 'react';

const CONDITION_CATEGORIES = [
  {
    key: 'cardiovascular',
    label: 'Cardiovascular',
    emoji: '\u2764\uFE0F',
    bg: '#fef2f2',
    border: '#dc2626',
    text: '#991b1b',
    conditions: [
      { key: 'hypertension', label: 'High Blood Pressure' },
      { key: 'highCholesterol', label: 'High Cholesterol' },
      { key: 'heartDisease', label: 'Heart Disease', hasType: true, typePlaceholder: 'e.g., CHF, CAD' },
    ]
  },
  {
    key: 'metabolic',
    label: 'Metabolic & Endocrine',
    emoji: '\u26A1',
    bg: '#fef3c7',
    border: '#f59e0b',
    text: '#92400e',
    conditions: [
      { key: 'diabetes', label: 'Diabetes', hasType: true, typeOptions: ['Type 1', 'Type 2', 'Pre-diabetes'] },
      { key: 'thyroid', label: 'Thyroid Disorder', hasType: true, typeOptions: ['Hypothyroid', 'Hyperthyroid', "Hashimoto's", "Graves' Disease", 'Other'] },
    ]
  },
  {
    key: 'mentalHealth',
    label: 'Mental Health',
    emoji: '\uD83E\uDDE0',
    bg: '#ede9fe',
    border: '#8b5cf6',
    text: '#5b21b6',
    conditions: [
      { key: 'depression', label: 'Depression / Anxiety' },
      { key: 'eatingDisorder', label: 'Eating Disorder' },
    ]
  },
  {
    key: 'organHealth',
    label: 'Organ Health',
    emoji: '\uD83E\uDEC0',
    bg: '#ecfdf5',
    border: '#10b981',
    text: '#047857',
    conditions: [
      { key: 'kidney', label: 'Kidney Disease' },
      { key: 'liver', label: 'Liver Disease' },
    ]
  },
  {
    key: 'immune',
    label: 'Immune & Cancer',
    emoji: '\uD83D\uDEE1\uFE0F',
    bg: '#f3e8ff',
    border: '#a855f7',
    text: '#6b21a8',
    conditions: [
      { key: 'autoimmune', label: 'Autoimmune Disorder', hasType: true, typePlaceholder: 'e.g., Lupus, RA' },
      { key: 'cancer', label: 'Cancer', hasType: true, typePlaceholder: 'e.g., Breast, Prostate' },
    ]
  }
];

const REFERRAL_SOURCES = [
  'Dr. G',
  'Aaron Berger',
  'Instagram',
  'Social Media',
  'Walk-in',
  'Friend or Family Member',
  'Range Sports Therapy',
  'Society OC',
  'Other'
];

const TOTAL_STEPS = 5;

const inputStyle = {
  width: '100%',
  padding: '0.875rem 1rem',
  fontSize: '1rem',
  border: '1px solid #e5e5e5',
  borderRadius: '8px',
  fontFamily: 'inherit',
  boxSizing: 'border-box'
};

const smallInputStyle = {
  ...inputStyle,
  padding: '0.625rem 0.875rem',
  fontSize: '0.875rem',
  borderRadius: '6px'
};

const selectStyle = {
  ...inputStyle,
  background: '#fff',
  cursor: 'pointer'
};

const radioGroupStyle = {
  display: 'flex',
  gap: '1.5rem',
  marginTop: '0.5rem'
};

const radioItemStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  cursor: 'pointer',
  fontSize: '0.9375rem'
};

const radioInputStyle = {
  width: 18,
  height: 18,
  cursor: 'pointer',
  accentColor: '#000'
};

const sectionTitleStyle = {
  fontSize: '0.9375rem',
  fontWeight: 600,
  color: '#171717',
  margin: '0 0 1rem'
};

const fieldLabelStyle = {
  fontSize: '0.875rem',
  fontWeight: 600,
  color: '#525252',
  marginBottom: '0.5rem',
  display: 'block'
};

const requiredStar = { color: '#dc2626' };

const conditionDetailsStyle = {
  marginTop: '0.75rem',
  padding: '0.75rem',
  background: 'rgba(255,255,255,0.5)',
  borderRadius: '4px'
};

export default function MedicalIntakeForm({ intakeData, onIntakeChange, onSubmit, onBack, isSubmitting, error, patientName }) {
  const [step, setStep] = useState(1);
  const [validationError, setValidationError] = useState('');

  const updateField = (field, value) => {
    onIntakeChange({ ...intakeData, [field]: value });
  };

  const updateCondition = (condKey, field, value) => {
    const conditions = { ...(intakeData.conditions || {}) };
    conditions[condKey] = { ...(conditions[condKey] || {}), [field]: value };
    // Clear year/type when switching to No
    if (field === 'response' && value === 'No') {
      conditions[condKey] = { response: 'No', year: '', type: '' };
    }
    updateField('conditions', conditions);
  };

  const validateStep = () => {
    if (step === 1) {
      if (!intakeData.dob?.trim()) return 'Date of birth is required';
      if (!intakeData.gender) return 'Gender is required';
      if (!intakeData.streetAddress?.trim()) return 'Street address is required';
      if (!intakeData.city?.trim()) return 'City is required';
      if (!intakeData.state?.trim()) return 'State is required';
      if (!intakeData.postalCode?.trim()) return 'Postal code is required';
      if (!intakeData.howHeardAboutUs) return 'Please tell us how you heard about us';
      if (intakeData.howHeardAboutUs === 'Other' && !intakeData.howHeardOther?.trim()) return 'Please specify how you heard about us';
      if (intakeData.howHeardAboutUs === 'Friend or Family Member' && !intakeData.howHeardFriend?.trim()) return 'Please tell us who referred you';
      if (intakeData.isMinor === 'Yes') {
        if (!intakeData.guardianName?.trim()) return 'Parent/guardian name is required';
        if (!intakeData.guardianRelationship) return 'Guardian relationship is required';
      }
    }
    if (step === 2) {
      if (!intakeData.hasPCP) return 'Please indicate if you have a primary care physician';
      if (intakeData.hasPCP === 'Yes' && !intakeData.pcpName?.trim()) return 'Physician name is required';
      if (!intakeData.recentHospitalization) return 'Please indicate if you have been hospitalized recently';
      if (intakeData.recentHospitalization === 'Yes' && !intakeData.hospitalizationReason?.trim()) return 'Please provide the hospitalization reason';
    }
    if (step === 3) {
      const allCondKeys = CONDITION_CATEGORIES.flatMap(cat => cat.conditions.map(c => c.key));
      for (const key of allCondKeys) {
        if (!intakeData.conditions?.[key]?.response) {
          const cond = CONDITION_CATEGORIES.flatMap(cat => cat.conditions).find(c => c.key === key);
          return `Please answer Yes or No for ${cond?.label || key}`;
        }
      }
    }
    if (step === 4) {
      if (!intakeData.onHRT) return 'Please indicate if you are on HRT';
      if (!intakeData.onMedications) return 'Please indicate if you are taking medications';
      if (intakeData.onMedications === 'Yes' && !intakeData.currentMedications?.trim()) return 'Please list your medications';
      if (!intakeData.hasAllergies) return 'Please indicate if you have allergies';
      if (intakeData.hasAllergies === 'Yes' && !intakeData.allergiesList?.trim()) return 'Please list your allergies';
    }
    if (step === 5) {
      if (!intakeData.emergencyContactName?.trim()) return 'Emergency contact name is required';
      if (!intakeData.emergencyContactPhone?.trim()) return 'Emergency contact phone is required';
      if (!intakeData.emergencyContactRelationship?.trim()) return 'Emergency contact relationship is required';
    }
    return null;
  };

  const handleNext = () => {
    const err = validateStep();
    if (err) {
      setValidationError(err);
      return;
    }
    setValidationError('');
    setStep(prev => prev + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    setValidationError('');
    if (step === 1) {
      onBack();
    } else {
      setStep(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = () => {
    const err = validateStep();
    if (err) {
      setValidationError(err);
      return;
    }
    setValidationError('');
    onSubmit();
  };

  const renderRadioGroup = (name, value, onChange) => (
    <div style={radioGroupStyle}>
      <label style={radioItemStyle}>
        <input
          type="radio"
          name={name}
          checked={value === 'Yes'}
          onChange={() => onChange('Yes')}
          style={radioInputStyle}
        />
        Yes
      </label>
      <label style={radioItemStyle}>
        <input
          type="radio"
          name={name}
          checked={value === 'No'}
          onChange={() => onChange('No')}
          style={radioInputStyle}
        />
        No
      </label>
    </div>
  );

  const renderNavButtons = (isLast = false) => (
    <div className="ra-actions ra-actions-split" style={{ marginTop: '2rem' }}>
      <button className="ra-btn-secondary" onClick={handleBack}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        Back
      </button>
      {isLast ? (
        <button className="ra-btn-primary" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <span className="ra-spinner" />
              Submitting...
            </>
          ) : (
            <>
              Complete Intake
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </>
          )}
        </button>
      ) : (
        <button className="ra-btn-primary" onClick={handleNext}>
          Continue
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </button>
      )}
    </div>
  );

  return (
    <div className="ra-page">
      <section className="ra-form-section">
        <div className="ra-form-container" style={{ maxWidth: 600 }}>
          {/* Progress */}
          <div className="ra-progress">
            <div className="ra-progress-bar" style={{ width: `${(step / TOTAL_STEPS) * 100}%` }} />
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#737373' }}>
              Medical Intake — Step {step} of {TOTAL_STEPS}
            </span>
          </div>

          {validationError && (
            <div className="ra-error" style={{ marginBottom: '1.5rem' }}>{validationError}</div>
          )}

          {/* ═══════════════════════════════════════════════
              Step 1: Personal Details
              ═══════════════════════════════════════════════ */}
          {step === 1 && (
            <div className="ra-step">
              <h2>Personal Details</h2>
              <p className="ra-step-desc">
                We have your name, email, and phone from the assessment. Just a few more details to complete your profile.
              </p>

              {/* DOB + Gender */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={fieldLabelStyle}>Date of Birth <span style={requiredStar}>*</span></label>
                  <input
                    type="text"
                    value={intakeData.dob || ''}
                    onChange={(e) => updateField('dob', e.target.value)}
                    placeholder="MM/DD/YYYY"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={fieldLabelStyle}>Gender <span style={requiredStar}>*</span></label>
                  <select
                    value={intakeData.gender || ''}
                    onChange={(e) => updateField('gender', e.target.value)}
                    style={selectStyle}
                  >
                    <option value="">Select...</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Preferred Name */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={fieldLabelStyle}>Preferred Name</label>
                <input
                  type="text"
                  value={intakeData.preferredName || ''}
                  onChange={(e) => updateField('preferredName', e.target.value)}
                  placeholder="What would you like us to call you?"
                  style={inputStyle}
                />
              </div>

              {/* Address */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={fieldLabelStyle}>Street Address <span style={requiredStar}>*</span></label>
                <input
                  type="text"
                  value={intakeData.streetAddress || ''}
                  onChange={(e) => updateField('streetAddress', e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={fieldLabelStyle}>City <span style={requiredStar}>*</span></label>
                  <input
                    type="text"
                    value={intakeData.city || ''}
                    onChange={(e) => updateField('city', e.target.value)}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={fieldLabelStyle}>State <span style={requiredStar}>*</span></label>
                  <input
                    type="text"
                    value={intakeData.state || ''}
                    onChange={(e) => updateField('state', e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={fieldLabelStyle}>Postal Code <span style={requiredStar}>*</span></label>
                  <input
                    type="text"
                    value={intakeData.postalCode || ''}
                    onChange={(e) => updateField('postalCode', e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* How Heard About Us */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={fieldLabelStyle}>How did you hear about us? <span style={requiredStar}>*</span></label>
                <select
                  value={intakeData.howHeardAboutUs || ''}
                  onChange={(e) => updateField('howHeardAboutUs', e.target.value)}
                  style={selectStyle}
                >
                  <option value="">Select...</option>
                  {REFERRAL_SOURCES.map(source => (
                    <option key={source} value={source}>{source}</option>
                  ))}
                </select>
              </div>

              {intakeData.howHeardAboutUs === 'Other' && (
                <div style={{ marginBottom: '1rem', paddingLeft: '1rem', borderLeft: '3px solid #000' }}>
                  <label style={fieldLabelStyle}>Please specify <span style={requiredStar}>*</span></label>
                  <input
                    type="text"
                    value={intakeData.howHeardOther || ''}
                    onChange={(e) => updateField('howHeardOther', e.target.value)}
                    placeholder="How did you hear about us?"
                    style={inputStyle}
                  />
                </div>
              )}

              {intakeData.howHeardAboutUs === 'Friend or Family Member' && (
                <div style={{ marginBottom: '1rem', paddingLeft: '1rem', borderLeft: '3px solid #000' }}>
                  <label style={fieldLabelStyle}>Who is the friend or family member? <span style={requiredStar}>*</span></label>
                  <input
                    type="text"
                    value={intakeData.howHeardFriend || ''}
                    onChange={(e) => updateField('howHeardFriend', e.target.value)}
                    placeholder="Enter their name"
                    style={inputStyle}
                  />
                </div>
              )}

              {/* Minor Section */}
              <div style={{ background: '#fef3c7', border: '2px solid #f59e0b', padding: '1.25rem', borderRadius: '8px', marginBottom: '1rem' }}>
                <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#92400e', margin: '0 0 0.5rem' }}>
                  Is this patient under 18 years old?
                </h4>
                <p style={{ fontSize: '0.8125rem', color: '#78350f', margin: '0 0 0.75rem' }}>
                  If yes, a parent or legal guardian must complete this form.
                </p>
                {renderRadioGroup('isMinor', intakeData.isMinor || 'No', (val) => updateField('isMinor', val))}

                {intakeData.isMinor === 'Yes' && (
                  <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.5)', borderRadius: '4px' }}>
                    <div style={{ marginBottom: '0.75rem' }}>
                      <label style={fieldLabelStyle}>Parent/Guardian Name <span style={requiredStar}>*</span></label>
                      <input
                        type="text"
                        value={intakeData.guardianName || ''}
                        onChange={(e) => updateField('guardianName', e.target.value)}
                        placeholder="Full legal name"
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={fieldLabelStyle}>Relationship to Patient <span style={requiredStar}>*</span></label>
                      <select
                        value={intakeData.guardianRelationship || ''}
                        onChange={(e) => updateField('guardianRelationship', e.target.value)}
                        style={selectStyle}
                      >
                        <option value="">Select...</option>
                        <option value="Parent">Parent</option>
                        <option value="Legal Guardian">Legal Guardian</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {renderNavButtons()}
            </div>
          )}

          {/* ═══════════════════════════════════════════════
              Step 2: Healthcare Providers
              ═══════════════════════════════════════════════ */}
          {step === 2 && (
            <div className="ra-step">
              <h2>Healthcare Providers</h2>
              <p className="ra-step-desc">
                This helps us coordinate your care safely.
              </p>

              {/* PCP */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={sectionTitleStyle}>
                  Do you have a Primary Care Physician? <span style={requiredStar}>*</span>
                </h4>
                {renderRadioGroup('hasPCP', intakeData.hasPCP, (val) => updateField('hasPCP', val))}

                {intakeData.hasPCP === 'Yes' && (
                  <div style={{ marginTop: '1rem', paddingLeft: '1rem', borderLeft: '3px solid #000' }}>
                    <label style={fieldLabelStyle}>Physician Name <span style={requiredStar}>*</span></label>
                    <input
                      type="text"
                      value={intakeData.pcpName || ''}
                      onChange={(e) => updateField('pcpName', e.target.value)}
                      placeholder="e.g., Dr. Smith"
                      style={inputStyle}
                    />
                  </div>
                )}
              </div>

              {/* Hospitalization */}
              <div style={{ marginBottom: '1rem' }}>
                <h4 style={sectionTitleStyle}>
                  Have you been hospitalized in the past year? <span style={requiredStar}>*</span>
                </h4>
                {renderRadioGroup('recentHospitalization', intakeData.recentHospitalization, (val) => updateField('recentHospitalization', val))}

                {intakeData.recentHospitalization === 'Yes' && (
                  <div style={{ marginTop: '1rem', paddingLeft: '1rem', borderLeft: '3px solid #000' }}>
                    <label style={fieldLabelStyle}>What was the reason? <span style={requiredStar}>*</span></label>
                    <textarea
                      value={intakeData.hospitalizationReason || ''}
                      onChange={(e) => updateField('hospitalizationReason', e.target.value)}
                      placeholder="Please describe..."
                      rows={2}
                      style={{ ...inputStyle, resize: 'vertical' }}
                    />
                  </div>
                )}
              </div>

              {renderNavButtons()}
            </div>
          )}

          {/* ═══════════════════════════════════════════════
              Step 3: Medical History
              ═══════════════════════════════════════════════ */}
          {step === 3 && (
            <div className="ra-step">
              <h2>Medical History</h2>
              <p className="ra-step-desc">
                Please answer Yes or No for each condition. This helps our provider create a safe, personalized protocol.
              </p>

              {CONDITION_CATEGORIES.map((category) => (
                <div
                  key={category.key}
                  style={{
                    background: category.bg,
                    borderLeft: `4px solid ${category.border}`,
                    padding: '1rem',
                    borderRadius: '0 4px 4px 0',
                    marginBottom: '1.5rem'
                  }}
                >
                  <h3 style={{
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: category.text,
                    margin: '0 0 1rem'
                  }}>
                    {category.emoji} {category.label}
                  </h3>

                  {category.conditions.map((cond, idx) => {
                    const condData = intakeData.conditions?.[cond.key] || {};
                    return (
                      <div
                        key={cond.key}
                        style={{
                          marginBottom: idx < category.conditions.length - 1 ? '1rem' : 0,
                          paddingBottom: idx < category.conditions.length - 1 ? '1rem' : 0,
                          borderBottom: idx < category.conditions.length - 1 ? '1px solid rgba(0,0,0,0.1)' : 'none'
                        }}
                      >
                        <label style={{ fontWeight: 600, fontSize: '0.9375rem' }}>
                          {cond.label} <span style={requiredStar}>*</span>
                        </label>

                        <div style={{ ...radioGroupStyle, marginBottom: '0.5rem' }}>
                          <label style={radioItemStyle}>
                            <input
                              type="radio"
                              name={`cond_${cond.key}`}
                              checked={condData.response === 'Yes'}
                              onChange={() => updateCondition(cond.key, 'response', 'Yes')}
                              style={radioInputStyle}
                            />
                            Yes
                          </label>
                          <label style={radioItemStyle}>
                            <input
                              type="radio"
                              name={`cond_${cond.key}`}
                              checked={condData.response === 'No'}
                              onChange={() => updateCondition(cond.key, 'response', 'No')}
                              style={radioInputStyle}
                            />
                            No
                          </label>
                        </div>

                        {condData.response === 'Yes' && (
                          <div style={conditionDetailsStyle}>
                            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                              {cond.hasType && (
                                cond.typeOptions ? (
                                  <div style={{ flex: 1, minWidth: 140 }}>
                                    <label style={{ ...fieldLabelStyle, fontSize: '0.8125rem' }}>Type</label>
                                    <select
                                      value={condData.type || ''}
                                      onChange={(e) => updateCondition(cond.key, 'type', e.target.value)}
                                      style={smallInputStyle}
                                    >
                                      <option value="">Select...</option>
                                      {cond.typeOptions.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                      ))}
                                    </select>
                                  </div>
                                ) : (
                                  <div style={{ flex: 1, minWidth: 140 }}>
                                    <label style={{ ...fieldLabelStyle, fontSize: '0.8125rem' }}>Type</label>
                                    <input
                                      type="text"
                                      value={condData.type || ''}
                                      onChange={(e) => updateCondition(cond.key, 'type', e.target.value)}
                                      placeholder={cond.typePlaceholder || 'Type'}
                                      style={smallInputStyle}
                                    />
                                  </div>
                                )
                              )}
                              <div style={{ flex: cond.hasType ? '0 0 140px' : 1 }}>
                                <label style={{ ...fieldLabelStyle, fontSize: '0.8125rem' }}>Year Diagnosed</label>
                                <input
                                  type="text"
                                  value={condData.year || ''}
                                  onChange={(e) => updateCondition(cond.key, 'year', e.target.value)}
                                  placeholder="e.g., 2020"
                                  style={smallInputStyle}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}

              {renderNavButtons()}
            </div>
          )}

          {/* ═══════════════════════════════════════════════
              Step 4: Medications & Allergies
              ═══════════════════════════════════════════════ */}
          {step === 4 && (
            <div className="ra-step">
              <h2>Medications & Allergies</h2>
              <p className="ra-step-desc">
                This ensures we can provide safe, effective treatment.
              </p>

              {/* HRT */}
              <div style={{
                background: '#dbeafe',
                border: '2px solid #3b82f6',
                padding: '1.25rem',
                borderRadius: '8px',
                marginBottom: '1.5rem'
              }}>
                <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#1e40af', margin: '0 0 0.75rem' }}>
                  Are you currently on Hormone Replacement Therapy (HRT)? <span style={requiredStar}>*</span>
                </h4>
                {renderRadioGroup('onHRT', intakeData.onHRT, (val) => updateField('onHRT', val))}

                {intakeData.onHRT === 'Yes' && (
                  <div style={{ marginTop: '1rem' }}>
                    <label style={fieldLabelStyle}>Please describe your HRT regimen</label>
                    <textarea
                      value={intakeData.hrtDetails || ''}
                      onChange={(e) => updateField('hrtDetails', e.target.value)}
                      placeholder="What are you taking? Dosage? How long?"
                      rows={2}
                      style={{ ...inputStyle, resize: 'vertical' }}
                    />
                  </div>
                )}
              </div>

              {/* Medications */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={sectionTitleStyle}>
                  Are you currently taking any other medications? <span style={requiredStar}>*</span>
                </h4>
                {renderRadioGroup('onMedications', intakeData.onMedications, (val) => updateField('onMedications', val))}

                {intakeData.onMedications === 'Yes' && (
                  <div style={{ marginTop: '1rem', paddingLeft: '1rem', borderLeft: '3px solid #000' }}>
                    <label style={fieldLabelStyle}>Please list all medications <span style={requiredStar}>*</span></label>
                    <textarea
                      value={intakeData.currentMedications || ''}
                      onChange={(e) => updateField('currentMedications', e.target.value)}
                      placeholder="Include prescription medications, over-the-counter drugs, and supplements..."
                      rows={3}
                      style={{ ...inputStyle, resize: 'vertical' }}
                    />
                  </div>
                )}
              </div>

              {/* Allergies */}
              <div style={{ marginBottom: '1rem' }}>
                <h4 style={sectionTitleStyle}>
                  Do you have any known allergies? <span style={requiredStar}>*</span>
                </h4>
                {renderRadioGroup('hasAllergies', intakeData.hasAllergies, (val) => updateField('hasAllergies', val))}

                {intakeData.hasAllergies === 'Yes' && (
                  <div style={{ marginTop: '1rem', paddingLeft: '1rem', borderLeft: '3px solid #000' }}>
                    <label style={fieldLabelStyle}>Please list your allergies and reactions <span style={requiredStar}>*</span></label>
                    <textarea
                      value={intakeData.allergiesList || ''}
                      onChange={(e) => updateField('allergiesList', e.target.value)}
                      placeholder="e.g., Penicillin - rash, Shellfish - anaphylaxis"
                      rows={2}
                      style={{ ...inputStyle, resize: 'vertical' }}
                    />
                  </div>
                )}
              </div>

              {renderNavButtons()}
            </div>
          )}

          {/* ═══════════════════════════════════════════════
              Step 5: Emergency Contact + Notes
              ═══════════════════════════════════════════════ */}
          {step === 5 && (
            <div className="ra-step">
              <h2>Emergency Contact</h2>
              <p className="ra-step-desc">
                Almost done — just a few final details for your safety.
              </p>

              <div className="ra-field">
                <label htmlFor="ecName">Full Name <span style={requiredStar}>*</span></label>
                <input
                  type="text"
                  id="ecName"
                  value={intakeData.emergencyContactName || ''}
                  onChange={(e) => updateField('emergencyContactName', e.target.value)}
                  placeholder="Jane Smith"
                  style={inputStyle}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="ra-field" style={{ marginBottom: 0 }}>
                  <label htmlFor="ecPhone">Phone <span style={requiredStar}>*</span></label>
                  <input
                    type="tel"
                    id="ecPhone"
                    value={intakeData.emergencyContactPhone || ''}
                    onChange={(e) => updateField('emergencyContactPhone', e.target.value)}
                    placeholder="(949) 555-1234"
                    style={inputStyle}
                  />
                </div>
                <div className="ra-field" style={{ marginBottom: 0 }}>
                  <label htmlFor="ecRelationship">Relationship <span style={requiredStar}>*</span></label>
                  <input
                    type="text"
                    id="ecRelationship"
                    value={intakeData.emergencyContactRelationship || ''}
                    onChange={(e) => updateField('emergencyContactRelationship', e.target.value)}
                    placeholder="Spouse, parent, sibling..."
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Additional Notes */}
              <div style={{ marginTop: '1.5rem' }}>
                <h4 style={sectionTitleStyle}>Anything else we should know?</h4>
                <textarea
                  value={intakeData.additionalNotes || ''}
                  onChange={(e) => updateField('additionalNotes', e.target.value)}
                  placeholder="Optional — share any other health concerns, goals, or information that might be helpful..."
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>

              {/* Consent */}
              <div style={{
                background: '#fafafa',
                padding: '1rem',
                borderRadius: '8px',
                marginTop: '1.5rem',
                fontSize: '0.875rem',
                color: '#525252'
              }}>
                <p style={{ margin: '0 0 0.5rem', fontWeight: 600, color: '#171717' }}>By completing this form, I certify that:</p>
                <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
                  <li style={{ marginBottom: '0.25rem' }}>The information I have provided is true and complete to the best of my knowledge.</li>
                  <li style={{ marginBottom: '0.25rem' }}>I will inform Range Medical of any changes to my health status.</li>
                  <li>I authorize Range Medical to use this information to provide care.</li>
                </ul>
              </div>

              {error && <div className="ra-error" style={{ marginTop: '1rem' }}>{error}</div>}

              {renderNavButtons(true)}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
