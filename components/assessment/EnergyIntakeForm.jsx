export default function EnergyIntakeForm({ intakeData, onIntakeChange, onSubmit, onBack, isSubmitting, error, patientName, recommendation }) {
  const updateField = (field, value) => {
    onIntakeChange({ ...intakeData, [field]: value });
  };

  const validateAndSubmit = () => {
    if (!intakeData.emergencyContactName?.trim()) return;
    if (!intakeData.emergencyContactPhone?.trim()) return;
    if (!intakeData.emergencyContactRelationship?.trim()) return;
    onSubmit();
  };

  return (
    <div className="ra-page">
      <section className="ra-form-section">
        <div className="ra-form-container" style={{ maxWidth: 600 }}>
          <div className="ra-step">
            <h2>Before You Book, Help Us Prepare</h2>
            <p className="ra-step-desc">
              This takes about 1 minute and helps our team get ready for your visit.
            </p>

            {/* Current Medications */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#171717', margin: '0 0 0.75rem' }}>
                Current Medications
              </h4>
              <textarea
                value={intakeData.currentMedicationsText || ''}
                onChange={(e) => updateField('currentMedicationsText', e.target.value)}
                placeholder="List any medications, supplements, or vitamins you take regularly..."
                rows={3}
                style={{ width: '100%', padding: '0.875rem 1rem', fontSize: '0.9375rem', border: '1px solid #e5e5e5', borderRadius: '8px', fontFamily: 'inherit', resize: 'vertical' }}
              />
              <label
                className={`ra-multiselect-option ${intakeData.noCurrentMedications ? 'ra-selected' : ''}`}
                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', cursor: 'pointer', marginTop: '0.5rem' }}
              >
                <input
                  type="checkbox"
                  checked={!!intakeData.noCurrentMedications}
                  onChange={(e) => {
                    updateField('noCurrentMedications', e.target.checked);
                    if (e.target.checked) updateField('currentMedicationsText', '');
                  }}
                  style={{ display: 'none' }}
                />
                <span style={{ fontSize: '0.875rem', color: '#525252' }}>No current medications</span>
                {intakeData.noCurrentMedications && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
              </label>
            </div>

            {/* Known Allergies */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#171717', margin: '0 0 0.75rem' }}>
                Known Allergies
              </h4>
              <label
                className={`ra-multiselect-option ${intakeData.noKnownAllergies ? 'ra-selected' : ''}`}
                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', cursor: 'pointer', marginBottom: '0.5rem' }}
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
                <span style={{ fontSize: '0.875rem', color: '#525252' }}>No known allergies</span>
                {intakeData.noKnownAllergies && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
              </label>
              {!intakeData.noKnownAllergies && (
                <input
                  type="text"
                  value={intakeData.knownAllergiesText || ''}
                  onChange={(e) => updateField('knownAllergiesText', e.target.value)}
                  placeholder="List any allergies..."
                  style={{ width: '100%', padding: '0.875rem 1rem', fontSize: '0.9375rem', border: '1px solid #e5e5e5', borderRadius: '8px', fontFamily: 'inherit' }}
                />
              )}
            </div>

            {/* Diagnosed Conditions */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#171717', margin: '0 0 0.75rem' }}>
                Any Diagnosed Conditions
              </h4>
              <textarea
                value={intakeData.diagnosedConditionsText || ''}
                onChange={(e) => updateField('diagnosedConditionsText', e.target.value)}
                placeholder="e.g., hypothyroidism, high blood pressure, diabetes..."
                rows={2}
                style={{ width: '100%', padding: '0.875rem 1rem', fontSize: '0.9375rem', border: '1px solid #e5e5e5', borderRadius: '8px', fontFamily: 'inherit', resize: 'vertical' }}
              />
            </div>

            {/* Emergency Contact */}
            <div style={{ marginBottom: '0.5rem' }}>
              <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#171717', margin: '0 0 0.75rem' }}>
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
              <div className="ra-form-grid">
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
                    placeholder="Spouse, parent..."
                    style={{ width: '100%', padding: '0.875rem 1rem', fontSize: '1rem', border: '1px solid #e5e5e5', borderRadius: '8px', fontFamily: 'inherit' }}
                  />
                </div>
              </div>
            </div>

            {error && <div className="ra-error">{error}</div>}

            <div className="ra-actions ra-actions-split" style={{ marginTop: '1.5rem' }}>
              <button className="ra-btn-secondary" onClick={onBack}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
                Back
              </button>
              <button
                className="ra-btn-primary"
                onClick={validateAndSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="ra-spinner" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Complete & Continue
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
