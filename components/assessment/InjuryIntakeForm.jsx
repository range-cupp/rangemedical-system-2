import { useState } from 'react';

const medicalConditions = {
  'Cardiovascular': [
    'High Blood Pressure',
    'High Cholesterol',
    'Heart Disease',
    'Stroke',
    'Blood Clots'
  ],
  'Metabolic': [
    'Diabetes / Pre-Diabetes',
    'Thyroid Issues'
  ],
  'Musculoskeletal': [
    'Arthritis',
    'Osteoporosis',
    'Previous Fractures'
  ],
  'Neurological': [
    'Seizures',
    'Migraines'
  ],
  'Respiratory': [
    'Asthma',
    'Sleep Apnea'
  ],
  'Other': [
    'Cancer',
    'Autoimmune Condition',
    'Mental Health Condition'
  ]
};

export default function InjuryIntakeForm({ intakeData, onIntakeChange, onSubmit, onBack, isSubmitting, error, patientName }) {
  const [intakeStep, setIntakeStep] = useState(1);

  const updateField = (field, value) => {
    onIntakeChange({ ...intakeData, [field]: value });
  };

  const toggleCondition = (condition) => {
    const history = { ...(intakeData.medicalHistory || {}) };
    if (history[condition]) {
      delete history[condition];
    } else {
      history[condition] = { diagnosed: true, year: '' };
    }
    updateField('medicalHistory', history);
  };

  const updateConditionYear = (condition, year) => {
    const history = { ...(intakeData.medicalHistory || {}) };
    history[condition] = { ...history[condition], year };
    updateField('medicalHistory', history);
  };

  const updateConditionDetail = (condition, detail) => {
    const history = { ...(intakeData.medicalHistory || {}) };
    history[condition] = { ...history[condition], detail };
    updateField('medicalHistory', history);
  };

  const addMedication = () => {
    const meds = [...(intakeData.medications || []), { name: '', dosage: '', frequency: '' }];
    updateField('medications', meds);
  };

  const removeMedication = (index) => {
    const meds = (intakeData.medications || []).filter((_, i) => i !== index);
    updateField('medications', meds);
  };

  const updateMedication = (index, field, value) => {
    const meds = [...(intakeData.medications || [])];
    meds[index] = { ...meds[index], [field]: value };
    updateField('medications', meds);
  };

  const addSurgery = () => {
    const surgeries = [...(intakeData.surgicalHistory || []), { procedure: '', year: '' }];
    updateField('surgicalHistory', surgeries);
  };

  const removeSurgery = (index) => {
    const surgeries = (intakeData.surgicalHistory || []).filter((_, i) => i !== index);
    updateField('surgicalHistory', surgeries);
  };

  const updateSurgery = (index, field, value) => {
    const surgeries = [...(intakeData.surgicalHistory || [])];
    surgeries[index] = { ...surgeries[index], [field]: value };
    updateField('surgicalHistory', surgeries);
  };

  const validateStep = () => {
    if (intakeStep === 3) {
      if (!intakeData.emergencyContactName?.trim()) return 'Emergency contact name is required';
      if (!intakeData.emergencyContactPhone?.trim()) return 'Emergency contact phone is required';
      if (!intakeData.emergencyContactRelationship?.trim()) return 'Emergency contact relationship is required';
    }
    return null;
  };

  const handleNext = () => {
    setIntakeStep(prev => prev + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    if (intakeStep === 1) {
      onBack();
    } else {
      setIntakeStep(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = () => {
    const validationError = validateStep();
    if (validationError) {
      return;
    }
    onSubmit();
  };

  return (
    <div className="ra-page">
      <section className="ra-form-section">
        <div className="ra-form-container" style={{ maxWidth: 600 }}>
          {/* Progress */}
          <div className="ra-progress">
            <div className="ra-progress-bar" style={{ width: `${(intakeStep / 3) * 100}%` }} />
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#737373' }}>
              Medical Intake — Step {intakeStep} of 3
            </span>
          </div>

          {/* Step 1: Medical History */}
          {intakeStep === 1 && (
            <div className="ra-step">
              <h2>Medical History</h2>
              <p className="ra-step-desc">
                Select any conditions you've been diagnosed with. This helps our provider create a safe, personalized protocol.
              </p>

              {Object.entries(medicalConditions).map(([category, conditions]) => (
                <div key={category} style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ fontSize: '0.8125rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#737373', margin: '0 0 0.75rem' }}>
                    {category}
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {conditions.map(condition => {
                      const isSelected = !!(intakeData.medicalHistory || {})[condition];
                      const needsDetail = ['Cancer', 'Autoimmune Condition', 'Mental Health Condition'].includes(condition);
                      return (
                        <div key={condition}>
                          <label
                            className={`ra-multiselect-option ${isSelected ? 'ra-selected' : ''}`}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 1.25rem', cursor: 'pointer' }}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleCondition(condition)}
                              style={{ display: 'none' }}
                            />
                            <span style={{ flex: 1, fontSize: '0.9375rem', color: '#171717' }}>{condition}</span>
                            {isSelected && (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="20 6 9 17 4 12"/>
                              </svg>
                            )}
                          </label>
                          {isSelected && (
                            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', paddingLeft: '0.5rem' }}>
                              <input
                                type="text"
                                placeholder="Year diagnosed (optional)"
                                value={(intakeData.medicalHistory[condition] || {}).year || ''}
                                onChange={(e) => updateConditionYear(condition, e.target.value)}
                                style={{
                                  flex: needsDetail ? '0 0 140px' : 1,
                                  padding: '0.625rem 0.875rem',
                                  fontSize: '0.875rem',
                                  border: '1px solid #e5e5e5',
                                  borderRadius: '6px',
                                  fontFamily: 'inherit'
                                }}
                              />
                              {needsDetail && (
                                <input
                                  type="text"
                                  placeholder={condition === 'Cancer' ? 'Type of cancer' : 'Please specify'}
                                  value={(intakeData.medicalHistory[condition] || {}).detail || ''}
                                  onChange={(e) => updateConditionDetail(condition, e.target.value)}
                                  style={{
                                    flex: 1,
                                    padding: '0.625rem 0.875rem',
                                    fontSize: '0.875rem',
                                    border: '1px solid #e5e5e5',
                                    borderRadius: '6px',
                                    fontFamily: 'inherit'
                                  }}
                                />
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              <div className="ra-actions ra-actions-split">
                <button className="ra-btn-secondary" onClick={handleBack}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                  </svg>
                  Back
                </button>
                <button className="ra-btn-primary" onClick={handleNext}>
                  Continue
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Medications + Allergies */}
          {intakeStep === 2 && (
            <div className="ra-step">
              <h2>Medications & Allergies</h2>
              <p className="ra-step-desc">
                List any medications you're currently taking and any known allergies.
              </p>

              {/* Medications */}
              <div style={{ marginBottom: '2rem' }}>
                <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#171717', margin: '0 0 1rem' }}>
                  Current Medications
                </h4>

                <label
                  className={`ra-multiselect-option ${intakeData.noCurrentMedications ? 'ra-selected' : ''}`}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 1.25rem', cursor: 'pointer', marginBottom: '0.75rem' }}
                >
                  <input
                    type="checkbox"
                    checked={!!intakeData.noCurrentMedications}
                    onChange={(e) => {
                      updateField('noCurrentMedications', e.target.checked);
                      if (e.target.checked) updateField('medications', []);
                    }}
                    style={{ display: 'none' }}
                  />
                  <span style={{ flex: 1, fontSize: '0.9375rem', color: '#171717' }}>No current medications</span>
                  {intakeData.noCurrentMedications && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </label>

                {!intakeData.noCurrentMedications && (
                  <>
                    {(intakeData.medications || []).map((med, i) => (
                      <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                        <input
                          type="text"
                          placeholder="Medication name"
                          value={med.name}
                          onChange={(e) => updateMedication(i, 'name', e.target.value)}
                          style={{ flex: 2, padding: '0.75rem', fontSize: '0.875rem', border: '1px solid #e5e5e5', borderRadius: '6px', fontFamily: 'inherit' }}
                        />
                        <input
                          type="text"
                          placeholder="Dosage"
                          value={med.dosage}
                          onChange={(e) => updateMedication(i, 'dosage', e.target.value)}
                          style={{ flex: 1, padding: '0.75rem', fontSize: '0.875rem', border: '1px solid #e5e5e5', borderRadius: '6px', fontFamily: 'inherit' }}
                        />
                        <input
                          type="text"
                          placeholder="Frequency"
                          value={med.frequency}
                          onChange={(e) => updateMedication(i, 'frequency', e.target.value)}
                          style={{ flex: 1, padding: '0.75rem', fontSize: '0.875rem', border: '1px solid #e5e5e5', borderRadius: '6px', fontFamily: 'inherit' }}
                        />
                        <button
                          onClick={() => removeMedication(i)}
                          style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '0.5rem', flexShrink: 0 }}
                          title="Remove"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={addMedication}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                        background: 'none', border: '1px dashed #d4d4d4', borderRadius: '6px',
                        padding: '0.625rem 1rem', fontSize: '0.875rem', color: '#525252',
                        cursor: 'pointer', fontFamily: 'inherit'
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                      Add Medication
                    </button>
                  </>
                )}
              </div>

              {/* Allergies */}
              <div>
                <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#171717', margin: '0 0 1rem' }}>
                  Allergies
                </h4>

                <label
                  className={`ra-multiselect-option ${intakeData.noKnownAllergies ? 'ra-selected' : ''}`}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 1.25rem', cursor: 'pointer', marginBottom: '0.75rem' }}
                >
                  <input
                    type="checkbox"
                    checked={!!intakeData.noKnownAllergies}
                    onChange={(e) => {
                      updateField('noKnownAllergies', e.target.checked);
                      if (e.target.checked) updateField('knownAllergiesText', '');
                    }}
                    style={{ display: 'none' }}
                  />
                  <span style={{ flex: 1, fontSize: '0.9375rem', color: '#171717' }}>No known allergies</span>
                  {intakeData.noKnownAllergies && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </label>

                {!intakeData.noKnownAllergies && (
                  <div className="ra-field">
                    <textarea
                      value={intakeData.knownAllergiesText || ''}
                      onChange={(e) => updateField('knownAllergiesText', e.target.value)}
                      placeholder="List any allergies (medications, foods, environmental)..."
                      rows={3}
                      style={{ width: '100%', padding: '0.875rem 1rem', fontSize: '0.9375rem', border: '1px solid #e5e5e5', borderRadius: '8px', fontFamily: 'inherit', resize: 'vertical' }}
                    />
                  </div>
                )}
              </div>

              <div className="ra-actions ra-actions-split" style={{ marginTop: '2rem' }}>
                <button className="ra-btn-secondary" onClick={handleBack}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                  </svg>
                  Back
                </button>
                <button className="ra-btn-primary" onClick={handleNext}>
                  Continue
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Surgical History + Emergency Contact */}
          {intakeStep === 3 && (
            <div className="ra-step">
              <h2>Surgical History & Emergency Contact</h2>
              <p className="ra-step-desc">
                Almost done — just a few more details to ensure your safety.
              </p>

              {/* Surgical History */}
              <div style={{ marginBottom: '2rem' }}>
                <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#171717', margin: '0 0 1rem' }}>
                  Surgical History
                </h4>

                <label
                  className={`ra-multiselect-option ${intakeData.noPriorSurgeries ? 'ra-selected' : ''}`}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 1.25rem', cursor: 'pointer', marginBottom: '0.75rem' }}
                >
                  <input
                    type="checkbox"
                    checked={!!intakeData.noPriorSurgeries}
                    onChange={(e) => {
                      updateField('noPriorSurgeries', e.target.checked);
                      if (e.target.checked) updateField('surgicalHistory', []);
                    }}
                    style={{ display: 'none' }}
                  />
                  <span style={{ flex: 1, fontSize: '0.9375rem', color: '#171717' }}>No prior surgeries</span>
                  {intakeData.noPriorSurgeries && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </label>

                {!intakeData.noPriorSurgeries && (
                  <>
                    {(intakeData.surgicalHistory || []).map((surgery, i) => (
                      <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                        <input
                          type="text"
                          placeholder="Procedure"
                          value={surgery.procedure}
                          onChange={(e) => updateSurgery(i, 'procedure', e.target.value)}
                          style={{ flex: 2, padding: '0.75rem', fontSize: '0.875rem', border: '1px solid #e5e5e5', borderRadius: '6px', fontFamily: 'inherit' }}
                        />
                        <input
                          type="text"
                          placeholder="Year"
                          value={surgery.year}
                          onChange={(e) => updateSurgery(i, 'year', e.target.value)}
                          style={{ flex: 1, padding: '0.75rem', fontSize: '0.875rem', border: '1px solid #e5e5e5', borderRadius: '6px', fontFamily: 'inherit' }}
                        />
                        <button
                          onClick={() => removeSurgery(i)}
                          style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '0.5rem', flexShrink: 0 }}
                          title="Remove"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={addSurgery}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                        background: 'none', border: '1px dashed #d4d4d4', borderRadius: '6px',
                        padding: '0.625rem 1rem', fontSize: '0.875rem', color: '#525252',
                        cursor: 'pointer', fontFamily: 'inherit'
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                      Add Surgery
                    </button>
                  </>
                )}
              </div>

              {/* Emergency Contact */}
              <div>
                <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#171717', margin: '0 0 1rem' }}>
                  Emergency Contact
                </h4>
                <div className="ra-field">
                  <label htmlFor="ecName">Full Name *</label>
                  <input
                    type="text"
                    id="ecName"
                    value={intakeData.emergencyContactName || ''}
                    onChange={(e) => updateField('emergencyContactName', e.target.value)}
                    placeholder="Jane Smith"
                    style={{ width: '100%', padding: '0.875rem 1rem', fontSize: '1rem', border: '1px solid #e5e5e5', borderRadius: '8px', fontFamily: 'inherit' }}
                  />
                </div>
                <div className="ra-field">
                  <label htmlFor="ecPhone">Phone *</label>
                  <input
                    type="tel"
                    id="ecPhone"
                    value={intakeData.emergencyContactPhone || ''}
                    onChange={(e) => updateField('emergencyContactPhone', e.target.value)}
                    placeholder="(949) 555-1234"
                    style={{ width: '100%', padding: '0.875rem 1rem', fontSize: '1rem', border: '1px solid #e5e5e5', borderRadius: '8px', fontFamily: 'inherit' }}
                  />
                </div>
                <div className="ra-field">
                  <label htmlFor="ecRelationship">Relationship *</label>
                  <input
                    type="text"
                    id="ecRelationship"
                    value={intakeData.emergencyContactRelationship || ''}
                    onChange={(e) => updateField('emergencyContactRelationship', e.target.value)}
                    placeholder="Spouse, parent, sibling..."
                    style={{ width: '100%', padding: '0.875rem 1rem', fontSize: '1rem', border: '1px solid #e5e5e5', borderRadius: '8px', fontFamily: 'inherit' }}
                  />
                </div>
              </div>

              {error && <div className="ra-error">{error}</div>}

              <div className="ra-actions ra-actions-split" style={{ marginTop: '2rem' }}>
                <button className="ra-btn-secondary" onClick={handleBack}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                  </svg>
                  Back
                </button>
                <button
                  className="ra-btn-primary"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
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
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
