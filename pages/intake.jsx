import Head from 'next/head';
import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://teivfptpozltpqwahgdl.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export default function IntakeForm() {
  const [scriptsLoaded, setScriptsLoaded] = useState(0);
  const formInitialized = useRef(false);

  useEffect(() => {
    if (scriptsLoaded >= 4 && !formInitialized.current) {
      formInitialized.current = true;
      initializeForm();
    }
  }, [scriptsLoaded]);

  const handleScriptLoad = () => {
    setScriptsLoaded(prev => prev + 1);
  };

  return (
    <>
      <Head>
        <title>New Patient Medical Intake | Range Medical</title>
        <meta name="description" content="Complete your new patient medical intake form for Range Medical." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"
        onLoad={handleScriptLoad}
      />
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"
        onLoad={handleScriptLoad}
      />
      <Script
        src="https://cdn.jsdelivr.net/npm/signature_pad@4.0.0/dist/signature_pad.umd.min.js"
        onLoad={handleScriptLoad}
      />
      <Script
        src="https://unpkg.com/imask"
        onLoad={handleScriptLoad}
      />

      <style jsx global>{`
        :root {
          --black: #000000;
          --white: #ffffff;
          --gray-50: #fafafa;
          --gray-100: #f5f5f5;
          --gray-200: #e5e5e5;
          --gray-300: #d4d4d4;
          --gray-400: #a3a3a3;
          --gray-500: #737373;
          --gray-600: #525252;
          --gray-700: #404040;
          --gray-800: #262626;
          --error: #dc2626;
          --success: #16a34a;
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background-color: var(--gray-100);
          color: var(--gray-800);
          line-height: 1.5;
        }

        .intake-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem;
        }

        .intake-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .clinic-name {
          font-size: 1.5rem;
          font-weight: 700;
          letter-spacing: 0.2em;
          margin-bottom: 0.5rem;
        }

        .form-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--gray-700);
          margin-bottom: 0.5rem;
        }

        .form-container {
          background: var(--white);
          border-radius: 8px;
          padding: 2rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .section {
          margin-bottom: 2rem;
          padding-bottom: 2rem;
          border-bottom: 1px solid var(--gray-200);
        }

        .section:last-child {
          border-bottom: none;
          margin-bottom: 0;
          padding-bottom: 0;
        }

        .section-title {
          font-size: 1.125rem;
          font-weight: 700;
          margin-bottom: 1.5rem;
          padding-bottom: 0.5rem;
          border-bottom: 2px solid var(--black);
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-group.full-width {
          grid-column: 1 / -1;
        }

        .form-group label {
          font-size: 0.875rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: var(--gray-700);
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          padding: 0.75rem;
          border: 1px solid var(--gray-300);
          border-radius: 4px;
          font-size: 1rem;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: var(--black);
          box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1);
        }

        .form-group input.error,
        .form-group select.error,
        .form-group textarea.error {
          border-color: var(--error);
        }

        .required {
          color: var(--error);
        }

        .field-error {
          font-size: 0.75rem;
          color: var(--error);
          margin-top: 0.25rem;
          display: none;
        }

        .field-error.visible {
          display: block;
        }

        .validation-summary {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          padding: 1rem 1.5rem;
          margin-bottom: 1rem;
          display: none;
        }

        .validation-summary.visible {
          display: block;
        }

        .validation-summary h3 {
          color: #991b1b;
          font-size: 0.9375rem;
          margin-bottom: 0.5rem;
        }

        .validation-summary ul {
          margin: 0;
          padding-left: 1.25rem;
          color: #dc2626;
          font-size: 0.875rem;
        }

        .validation-summary ul li {
          margin-bottom: 0.25rem;
        }

        .condition-item.has-error {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 4px;
          padding: 0.5rem;
          margin-bottom: 0.75rem;
        }

        .field-hint {
          font-size: 0.75rem;
          font-weight: 400;
          color: var(--gray-500);
          text-transform: none;
          letter-spacing: normal;
          margin-top: 0.25rem;
        }

        .radio-group {
          display: flex;
          gap: 1.5rem;
          margin-top: 0.5rem;
        }

        .radio-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .radio-item input[type="radio"] {
          width: 18px;
          height: 18px;
          cursor: pointer;
        }

        .radio-item label {
          margin-bottom: 0;
          cursor: pointer;
        }

        .conditional-field {
          display: none;
          margin-top: 1rem;
          padding: 1rem;
          background: var(--gray-50);
          border-radius: 4px;
          border-left: 3px solid var(--black);
        }

        .conditional-field.visible {
          display: block;
        }

        /* File upload styles */
        .file-upload-container {
          margin-top: 0.5rem;
        }

        .file-preview {
          display: none;
          margin-top: 0.75rem;
          padding: 0.75rem;
          background: var(--gray-50);
          border-radius: 4px;
          border: 1px solid var(--gray-200);
        }

        .file-preview.visible {
          display: block;
        }

        .file-preview img {
          max-width: 200px;
          max-height: 150px;
          border-radius: 4px;
          margin-bottom: 0.5rem;
        }

        .file-name {
          font-size: 0.875rem;
          color: var(--gray-600);
        }

        /* Symptom Checklist Styles */
        .symptom-section {
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          border-left: 4px solid #0284c7;
          padding: 1.5rem;
          margin: 1.5rem 0;
          border-radius: 0 8px 8px 0;
        }

        .symptom-section-title {
          font-size: 1rem;
          font-weight: 700;
          color: #0369a1;
          margin-bottom: 0.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .symptom-section-subtitle {
          font-size: 0.875rem;
          color: var(--gray-600);
          margin-bottom: 1rem;
        }

        .symptom-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 0.75rem;
        }

        .symptom-item {
          background: var(--white);
          border: 1px solid var(--gray-200);
          border-radius: 6px;
          padding: 0.75rem 1rem;
          transition: all 0.2s;
        }

        .symptom-item:hover {
          border-color: var(--gray-400);
        }

        .symptom-item.selected {
          border-color: #0284c7;
          background: #f0f9ff;
        }

        .symptom-checkbox-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .symptom-checkbox-row input[type="checkbox"] {
          width: 20px;
          height: 20px;
          cursor: pointer;
          accent-color: #0284c7;
        }

        .symptom-checkbox-row label {
          font-size: 0.9375rem;
          font-weight: 500;
          color: var(--gray-800);
          cursor: pointer;
          flex: 1;
          margin-bottom: 0;
        }

        .symptom-followup {
          display: none;
          margin-top: 0.75rem;
          padding-top: 0.75rem;
          border-top: 1px solid var(--gray-200);
        }

        .symptom-followup.visible {
          display: block;
        }

        .symptom-followup label {
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--gray-600);
          margin-bottom: 0.5rem;
          display: block;
        }

        .symptom-followup select,
        .symptom-followup input {
          width: 100%;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          border: 1px solid var(--gray-300);
          border-radius: 4px;
        }

        .symptom-duration {
          display: none;
          margin-top: 1rem;
          padding: 1rem;
          background: var(--white);
          border-radius: 6px;
          border: 1px solid var(--gray-200);
        }

        .symptom-duration.visible {
          display: block;
        }

        .symptom-duration label {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--gray-700);
          margin-bottom: 0.5rem;
          display: block;
        }

        .duration-options {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .duration-option {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          background: var(--gray-50);
          border: 1px solid var(--gray-200);
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .duration-option:hover {
          border-color: var(--gray-400);
        }

        .duration-option input[type="radio"] {
          width: 16px;
          height: 16px;
          accent-color: #0284c7;
        }

        .duration-option label {
          font-size: 0.8125rem;
          margin-bottom: 0;
          cursor: pointer;
        }

        /* Medical History Condition Styles */
        .condition-category {
          margin-bottom: 1.5rem;
          padding: 1rem;
          border-radius: 4px;
        }

        .condition-category h3 {
          font-size: 0.875rem;
          font-weight: 700;
          text-transform: uppercase;
          margin-bottom: 1rem;
        }

        .condition-item {
          margin-bottom: 1rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid rgba(0,0,0,0.1);
        }

        .condition-item:last-child {
          margin-bottom: 0;
          padding-bottom: 0;
          border-bottom: none;
        }

        .condition-details {
          display: none;
          margin-top: 0.75rem;
          padding: 0.75rem;
          background: rgba(255,255,255,0.5);
          border-radius: 4px;
        }

        .condition-details.visible {
          display: block;
        }

        /* Minor Section */
        .minor-section {
          background: #fef3c7;
          border: 2px solid #f59e0b;
          padding: 1.5rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
        }

        .minor-section-title {
          font-size: 1rem;
          font-weight: 700;
          color: #92400e;
          margin-bottom: 0.5rem;
        }

        .minor-section-subtitle {
          font-size: 0.875rem;
          color: #78350f;
          margin-bottom: 1rem;
        }

        /* Signature */
        .signature-container {
          border: 2px solid var(--gray-300);
          border-radius: 4px;
          background: var(--white);
          margin-bottom: 0.5rem;
        }

        .signature-canvas {
          width: 100%;
          height: 150px;
          display: block;
        }

        .signature-actions {
          display: flex;
          gap: 0.5rem;
          margin-top: 0.5rem;
        }

        .btn-clear {
          padding: 0.5rem 1rem;
          background: var(--gray-100);
          border: 1px solid var(--gray-300);
          border-radius: 4px;
          font-size: 0.875rem;
          cursor: pointer;
          transition: background 0.2s;
        }

        .btn-clear:hover {
          background: var(--gray-200);
        }

        /* Submit Button */
        .btn-submit {
          width: 100%;
          padding: 1rem;
          background: var(--black);
          color: var(--white);
          border: none;
          border-radius: 4px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }

        .btn-submit:hover {
          background: var(--gray-800);
        }

        .btn-submit:disabled {
          background: var(--gray-400);
          cursor: not-allowed;
        }

        /* Status Message */
        .status-message {
          padding: 1rem;
          border-radius: 4px;
          margin-bottom: 1rem;
          display: none;
        }

        .status-message.visible {
          display: block;
        }

        .status-message.loading {
          background: #dbeafe;
          color: #1e40af;
        }

        .status-message.success {
          background: #dcfce7;
          color: #166534;
        }

        .status-message.error {
          background: #fef2f2;
          color: #991b1b;
        }

        /* Thank You Screen */
        .thank-you-container {
          display: none;
          text-align: center;
          padding: 3rem 2rem;
        }

        .thank-you-container.visible {
          display: block;
        }

        .thank-you-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }

        .thank-you-title {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 1rem;
        }

        .thank-you-message {
          color: var(--gray-600);
          margin-bottom: 2rem;
        }

        .thank-you-details {
          background: var(--gray-50);
          padding: 1.5rem;
          border-radius: 8px;
          margin-bottom: 2rem;
          border-left: 4px solid var(--black);
          text-align: left;
        }

        .thank-you-details p {
          margin-bottom: 0.75rem;
          color: var(--gray-700);
        }

        .thank-you-details p:last-child {
          margin-bottom: 0;
        }

        .thank-you-footer {
          padding-top: 1.5rem;
          border-top: 1px solid var(--gray-200);
        }

        .thank-you-footer p {
          font-size: 1.25rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: var(--black);
        }

        @media (max-width: 600px) {
          .intake-container {
            padding: 1rem;
          }

          .form-container {
            padding: 1.5rem;
          }

          .form-row {
            grid-template-columns: 1fr;
          }

          .radio-group {
            flex-direction: column;
            gap: 0.75rem;
          }

          .duration-options {
            flex-direction: column;
          }
        }
      `}</style>

      <div className="intake-container" id="intakeContainer">
        <header className="intake-header">
          <h1 className="clinic-name">RANGE MEDICAL</h1>
          <h2 className="form-title">New Patient Medical Intake Form</h2>
          <p>Please complete all required fields marked with *</p>
        </header>

        <div className="form-container">
          <div className="status-message" id="statusMessage"></div>
          
          <form id="intakeForm" noValidate>

            {/* Personal Information */}
            <div className="section">
              <h2 className="section-title">Personal Information</h2>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName">Legal First Name <span className="required">*</span></label>
                  <input type="text" id="firstName" name="firstName" placeholder="As shown on government ID" required />
                  <span className="field-error" id="firstNameError">Legal first name is required</span>
                </div>
                <div className="form-group">
                  <label htmlFor="lastName">Legal Last Name <span className="required">*</span></label>
                  <input type="text" id="lastName" name="lastName" placeholder="As shown on government ID" required />
                  <span className="field-error" id="lastNameError">Legal last name is required</span>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="preferredName">Preferred Name</label>
                  <input type="text" id="preferredName" name="preferredName" placeholder="What would you like us to call you?" />
                </div>
                <div className="form-group">
                  <label htmlFor="gender">Gender <span className="required">*</span></label>
                  <select id="gender" name="gender" required>
                    <option value="">Select...</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  <span className="field-error" id="genderError">Please select an option</span>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="dob">Date of Birth <span className="required">*</span></label>
                  <input type="text" id="dob" name="dob" placeholder="MM/DD/YYYY" required />
                  <span className="field-error" id="dobError">Date of birth is required</span>
                </div>
                <div className="form-group">
                  <label htmlFor="phone">Phone Number <span className="required">*</span></label>
                  <input type="tel" id="phone" name="phone" placeholder="(555) 555-5555" required />
                  <span className="field-error" id="phoneError">Phone number is required</span>
                </div>
              </div>

              {/* Minor Section */}
              <div className="minor-section" style={{marginTop: '1rem', marginBottom: '1rem'}}>
                <h3 className="minor-section-title">👶 Is this patient under 18 years old?</h3>
                <p className="minor-section-subtitle">If yes, a parent or legal guardian must complete this form.</p>
                
                <div className="form-row" style={{marginBottom: 0}}>
                  <div className="form-group full-width">
                    <div className="radio-group">
                      <div className="radio-item">
                        <input type="radio" id="isMinorYes" name="isMinor" value="Yes" />
                        <label htmlFor="isMinorYes">Yes, patient is under 18</label>
                      </div>
                      <div className="radio-item">
                        <input type="radio" id="isMinorNo" name="isMinor" value="No" defaultChecked />
                        <label htmlFor="isMinorNo">No, patient is 18 or older</label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="conditional-field" id="guardianFieldsTop">
                  <p style={{fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '1rem'}}>The phone and email above will be used as the primary contact for the parent/guardian.</p>
                  <div className="form-row" style={{marginBottom: 0}}>
                    <div className="form-group">
                      <label htmlFor="guardianName">Parent/Guardian Name <span className="required">*</span></label>
                      <input type="text" id="guardianName" name="guardianName" placeholder="Full legal name" />
                      <span className="field-error" id="guardianNameError">Parent/guardian name is required</span>
                    </div>
                    <div className="form-group">
                      <label htmlFor="guardianRelationship">Relationship to Patient <span className="required">*</span></label>
                      <select id="guardianRelationship" name="guardianRelationship">
                        <option value="">Select...</option>
                        <option value="Parent">Parent</option>
                        <option value="Legal Guardian">Legal Guardian</option>
                        <option value="Other">Other</option>
                      </select>
                      <span className="field-error" id="guardianRelationshipError">Please select relationship</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group full-width">
                  <label htmlFor="email">Email Address <span className="required">*</span></label>
                  <input type="email" id="email" name="email" placeholder="your@email.com" required />
                  <span className="field-error" id="emailError">Valid email is required</span>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group full-width">
                  <label htmlFor="streetAddress">Street Address <span className="required">*</span></label>
                  <input type="text" id="streetAddress" name="streetAddress" required />
                  <span className="field-error" id="streetAddressError">Street address is required</span>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="city">City <span className="required">*</span></label>
                  <input type="text" id="city" name="city" required />
                  <span className="field-error" id="cityError">City is required</span>
                </div>
                <div className="form-group">
                  <label htmlFor="state">State <span className="required">*</span></label>
                  <input type="text" id="state" name="state" required />
                  <span className="field-error" id="stateError">State is required</span>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="postalCode">Postal Code <span className="required">*</span></label>
                  <input type="text" id="postalCode" name="postalCode" required />
                  <span className="field-error" id="postalCodeError">Postal code is required</span>
                </div>
                <div className="form-group">
                  <label htmlFor="country">Country <span className="required">*</span></label>
                  <input type="text" id="country" name="country" defaultValue="United States" required />
                  <span className="field-error" id="countryError">Country is required</span>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group full-width">
                  <label htmlFor="howHeardAboutUs">How did you hear about us? <span className="required">*</span></label>
                  <select id="howHeardAboutUs" name="howHeardAboutUs" required>
                    <option value="">Select...</option>
                    <option value="Dr. G">Dr. G</option>
                    <option value="Aaron Berger">Aaron Berger</option>
                    <option value="Instagram">Instagram</option>
                    <option value="Social Media">Social Media</option>
                    <option value="Walk-in">Walk-in</option>
                    <option value="Friend or Family Member">Friend or Family Member</option>
                    <option value="Range Sports Therapy">Range Sports Therapy</option>
                    <option value="Society OC">Society OC</option>
                    <option value="Other">Other</option>
                  </select>
                  <span className="field-error" id="howHeardAboutUsError">Please select an option</span>
                </div>
              </div>

              <div className="conditional-field" id="howHeardOtherField">
                <div className="form-group">
                  <label htmlFor="howHeardOther">Please specify <span className="required">*</span></label>
                  <input type="text" id="howHeardOther" name="howHeardOther" placeholder="How did you hear about us?" />
                </div>
              </div>

              <div className="conditional-field" id="howHeardFriendField">
                <div className="form-group">
                  <label htmlFor="howHeardFriend">Who is the friend or family member? <span className="required">*</span></label>
                  <input type="text" id="howHeardFriend" name="howHeardFriend" placeholder="Enter their name" />
                </div>
              </div>
            </div>

            {/* Health Concerns Section */}
            <div className="section">
              <h2 className="section-title">Health Concerns</h2>

              {/* Decision Tree - Two Doors */}
              <div style={{background: 'var(--gray-50)', padding: '1.5rem', borderRadius: '8px'}}>
                <p style={{fontWeight: 600, marginBottom: '1rem', color: 'var(--gray-800)'}}>Help us understand your goals:</p>

                {/* Door 1: Injury */}
                <div style={{marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--gray-200)'}}>
                  <div className="form-group full-width">
                    <label style={{fontSize: '1rem', fontWeight: 600, color: '#b91c1c'}}>🩹 Are you dealing with an injury? <span className="required">*</span></label>
                    <div className="radio-group">
                      <div className="radio-item">
                        <input type="radio" id="injuredYes" name="injured" value="Yes" required />
                        <label htmlFor="injuredYes">Yes</label>
                      </div>
                      <div className="radio-item">
                        <input type="radio" id="injuredNo" name="injured" value="No" />
                        <label htmlFor="injuredNo">No</label>
                      </div>
                    </div>
                    <span className="field-error" id="injuredError">Please select an option</span>

                    <div className="conditional-field" id="injuryFields">
                      <div className="form-row">
                        <div className="form-group full-width">
                          <label htmlFor="injuryDescription">What is your injury? <span className="required">*</span></label>
                          <textarea id="injuryDescription" name="injuryDescription" rows="2" placeholder="Describe your injury..."></textarea>
                          <span className="field-error" id="injuryDescriptionError">Please describe your injury</span>
                        </div>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label htmlFor="injuryLocation">Where is it located? <span className="required">*</span></label>
                          <input type="text" id="injuryLocation" name="injuryLocation" placeholder="e.g., Lower back, Right knee" />
                          <span className="field-error" id="injuryLocationError">Please specify the location</span>
                        </div>
                        <div className="form-group">
                          <label htmlFor="injuryDate">When did it occur?</label>
                          <input type="text" id="injuryDate" name="injuryDate" placeholder="e.g., 2 weeks ago" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Door 2: Optimization */}
                <div>
                  <div className="form-group full-width">
                    <label style={{fontSize: '1rem', fontWeight: 600, color: '#0369a1'}}>⚡ Are you interested in energy & optimization? <span className="required">*</span></label>
                    <p style={{fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.75rem'}}>This includes: low energy, brain fog, weight management, hormone balance, sleep issues, or general wellness optimization.</p>
                    <div className="radio-group">
                      <div className="radio-item">
                        <input type="radio" id="optimizationYes" name="interestedInOptimization" value="Yes" required />
                        <label htmlFor="optimizationYes">Yes, tell me more</label>
                      </div>
                      <div className="radio-item">
                        <input type="radio" id="optimizationNo" name="interestedInOptimization" value="No" />
                        <label htmlFor="optimizationNo">No, not at this time</label>
                      </div>
                    </div>
                    <span className="field-error" id="interestedInOptimizationError">Please select an option</span>
                  </div>
                </div>
              </div>

              {/* Symptom Checklist */}
              <div className="symptom-section" id="symptomSection" style={{display: 'none'}}>
                <h3 className="symptom-section-title">⚡ Which symptoms are you experiencing?</h3>
                <p className="symptom-section-subtitle">Check all that apply. This helps us understand how we can help.</p>

                <div className="symptom-grid">
                  <div className="symptom-item" id="symptomBrainFog">
                    <div className="symptom-checkbox-row">
                      <input type="checkbox" id="symptom_brainFog" name="symptom_brainFog" value="Brain fog / difficulty concentrating" />
                      <label htmlFor="symptom_brainFog">Brain fog / difficulty concentrating</label>
                    </div>
                    <div className="symptom-followup" id="followup_brainFog">
                      <label htmlFor="brainFog_impact">Does this affect your work or daily tasks?</label>
                      <select id="brainFog_impact" name="brainFog_impact">
                        <option value="">Select...</option>
                        <option value="Yes, significantly">Yes, significantly</option>
                        <option value="Somewhat">Somewhat</option>
                        <option value="Not really">Not really</option>
                      </select>
                    </div>
                  </div>

                  <div className="symptom-item" id="symptomFatigue">
                    <div className="symptom-checkbox-row">
                      <input type="checkbox" id="symptom_fatigue" name="symptom_fatigue" value="Fatigue / low energy" />
                      <label htmlFor="symptom_fatigue">Fatigue / low energy</label>
                    </div>
                    <div className="symptom-followup" id="followup_fatigue">
                      <label htmlFor="fatigue_timing">When is your energy lowest?</label>
                      <select id="fatigue_timing" name="fatigue_timing">
                        <option value="">Select...</option>
                        <option value="Morning - hard to get going">Morning - hard to get going</option>
                        <option value="Afternoon crash">Afternoon crash</option>
                        <option value="Evening - exhausted by end of day">Evening - exhausted by end of day</option>
                        <option value="All day - constantly tired">All day - constantly tired</option>
                      </select>
                    </div>
                  </div>

                  <div className="symptom-item" id="symptomSleep">
                    <div className="symptom-checkbox-row">
                      <input type="checkbox" id="symptom_sleep" name="symptom_sleep" value="Poor sleep / insomnia" />
                      <label htmlFor="symptom_sleep">Poor sleep / insomnia</label>
                    </div>
                    <div className="symptom-followup" id="followup_sleep">
                      <label htmlFor="sleep_issue">What's your main sleep issue?</label>
                      <select id="sleep_issue" name="sleep_issue">
                        <option value="">Select...</option>
                        <option value="Trouble falling asleep">Trouble falling asleep</option>
                        <option value="Waking up during the night">Waking up during the night</option>
                        <option value="Waking up too early">Waking up too early</option>
                        <option value="Not feeling rested">Not feeling rested even after sleeping</option>
                        <option value="All of the above">All of the above</option>
                      </select>
                    </div>
                  </div>

                  <div className="symptom-item" id="symptomWeight">
                    <div className="symptom-checkbox-row">
                      <input type="checkbox" id="symptom_weight" name="symptom_weight" value="Weight gain / difficulty losing weight" />
                      <label htmlFor="symptom_weight">Weight gain / difficulty losing weight</label>
                    </div>
                    <div className="symptom-followup" id="followup_weight">
                      <label htmlFor="weight_efforts">Have diet and exercise changes helped?</label>
                      <select id="weight_efforts" name="weight_efforts">
                        <option value="">Select...</option>
                        <option value="Yes, somewhat">Yes, somewhat</option>
                        <option value="No, nothing seems to work">No, nothing seems to work</option>
                        <option value="Haven't tried yet">Haven't tried yet</option>
                      </select>
                    </div>
                  </div>

                  <div className="symptom-item" id="symptomLibido">
                    <div className="symptom-checkbox-row">
                      <input type="checkbox" id="symptom_libido" name="symptom_libido" value="Low libido / sexual dysfunction" />
                      <label htmlFor="symptom_libido">Low libido / sexual dysfunction</label>
                    </div>
                    <div className="symptom-followup" id="followup_libido">
                      <label htmlFor="libido_hormones">Have you had hormone levels checked before?</label>
                      <select id="libido_hormones" name="libido_hormones">
                        <option value="">Select...</option>
                        <option value="Yes, recently">Yes, recently (within past year)</option>
                        <option value="Yes, but not recently">Yes, but not recently</option>
                        <option value="No">No</option>
                        <option value="Not sure">Not sure</option>
                      </select>
                    </div>
                  </div>

                  <div className="symptom-item" id="symptomMood">
                    <div className="symptom-checkbox-row">
                      <input type="checkbox" id="symptom_mood" name="symptom_mood" value="Mood changes / irritability / anxiety" />
                      <label htmlFor="symptom_mood">Mood changes / irritability / anxiety</label>
                    </div>
                    <div className="symptom-followup" id="followup_mood">
                      <label htmlFor="mood_duration">Is this new or has it been ongoing?</label>
                      <select id="mood_duration" name="mood_duration">
                        <option value="">Select...</option>
                        <option value="New - started in past few months">New - started in past few months</option>
                        <option value="Been this way for a while">Been this way for a while</option>
                        <option value="Comes and goes">Comes and goes</option>
                      </select>
                    </div>
                  </div>

                  <div className="symptom-item" id="symptomRecovery">
                    <div className="symptom-checkbox-row">
                      <input type="checkbox" id="symptom_recovery" name="symptom_recovery" value="Slow recovery from workouts" />
                      <label htmlFor="symptom_recovery">Slow recovery from workouts</label>
                    </div>
                    <div className="symptom-followup" id="followup_recovery">
                      <label htmlFor="recovery_soreness">How long does soreness typically last?</label>
                      <select id="recovery_soreness" name="recovery_soreness">
                        <option value="">Select...</option>
                        <option value="2-3 days">2-3 days</option>
                        <option value="4-5 days">4-5 days</option>
                        <option value="A week or more">A week or more</option>
                      </select>
                    </div>
                  </div>

                  <div className="symptom-item" id="symptomMuscle">
                    <div className="symptom-checkbox-row">
                      <input type="checkbox" id="symptom_muscle" name="symptom_muscle" value="Muscle loss / weakness" />
                      <label htmlFor="symptom_muscle">Muscle loss / weakness</label>
                    </div>
                    <div className="symptom-followup" id="followup_muscle">
                      <label htmlFor="muscle_exercise">Is this happening even with regular exercise?</label>
                      <select id="muscle_exercise" name="muscle_exercise">
                        <option value="">Select...</option>
                        <option value="Yes, even with exercise">Yes, even with exercise</option>
                        <option value="Not exercising regularly">Not exercising regularly</option>
                        <option value="Just started noticing">Just started noticing</option>
                      </select>
                    </div>
                  </div>

                  <div className="symptom-item" id="symptomHair">
                    <div className="symptom-checkbox-row">
                      <input type="checkbox" id="symptom_hair" name="symptom_hair" value="Hair thinning or loss" />
                      <label htmlFor="symptom_hair">Hair thinning or loss</label>
                    </div>
                    <div className="symptom-followup" id="followup_hair">
                      <label htmlFor="hair_location">Where are you noticing it most?</label>
                      <select id="hair_location" name="hair_location">
                        <option value="">Select...</option>
                        <option value="Hairline / temples">Hairline / temples</option>
                        <option value="Crown / top of head">Crown / top of head</option>
                        <option value="All over / general thinning">All over / general thinning</option>
                        <option value="Other areas">Other areas</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="symptom-duration" id="symptomDuration">
                  <label>How long have you been experiencing these symptoms?</label>
                  <div className="duration-options">
                    <div className="duration-option">
                      <input type="radio" id="duration_1month" name="symptomDuration" value="Less than 1 month" />
                      <label htmlFor="duration_1month">Less than 1 month</label>
                    </div>
                    <div className="duration-option">
                      <input type="radio" id="duration_1to3" name="symptomDuration" value="1-3 months" />
                      <label htmlFor="duration_1to3">1-3 months</label>
                    </div>
                    <div className="duration-option">
                      <input type="radio" id="duration_3to6" name="symptomDuration" value="3-6 months" />
                      <label htmlFor="duration_3to6">3-6 months</label>
                    </div>
                    <div className="duration-option">
                      <input type="radio" id="duration_6to12" name="symptomDuration" value="6-12 months" />
                      <label htmlFor="duration_6to12">6-12 months</label>
                    </div>
                    <div className="duration-option">
                      <input type="radio" id="duration_over1year" name="symptomDuration" value="More than a year" />
                      <label htmlFor="duration_over1year">More than a year</label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="form-row" style={{marginTop: '1.5rem'}}>
                <div className="form-group full-width">
                  <label htmlFor="additionalNotes">Anything else we should know?</label>
                  <textarea id="additionalNotes" name="additionalNotes" rows="3" placeholder="Optional - share any other health concerns, goals, or information that might be helpful..."></textarea>
                </div>
              </div>
            </div>

            {/* Healthcare Providers */}
            <div className="section">
              <h2 className="section-title">Healthcare Providers</h2>

              <div className="form-row">
                <div className="form-group full-width">
                  <label>Do you have a Primary Care Physician? <span className="required">*</span></label>
                  <div className="radio-group">
                    <div className="radio-item">
                      <input type="radio" id="pcpYes" name="hasPCP" value="Yes" required />
                      <label htmlFor="pcpYes">Yes</label>
                    </div>
                    <div className="radio-item">
                      <input type="radio" id="pcpNo" name="hasPCP" value="No" />
                      <label htmlFor="pcpNo">No</label>
                    </div>
                  </div>
                  <span className="field-error" id="hasPCPError">Please select an option</span>

                  <div className="conditional-field" id="pcpFields">
                    <div className="form-group">
                      <label htmlFor="pcpName">Physician Name <span className="required">*</span></label>
                      <input type="text" id="pcpName" name="pcpName" placeholder="e.g., Dr. Smith" />
                      <span className="field-error" id="pcpNameError">Physician name is required</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group full-width">
                  <label>Have you been hospitalized in the past year? <span className="required">*</span></label>
                  <div className="radio-group">
                    <div className="radio-item">
                      <input type="radio" id="hospitalYes" name="recentHospitalization" value="Yes" required />
                      <label htmlFor="hospitalYes">Yes</label>
                    </div>
                    <div className="radio-item">
                      <input type="radio" id="hospitalNo" name="recentHospitalization" value="No" />
                      <label htmlFor="hospitalNo">No</label>
                    </div>
                  </div>
                  <span className="field-error" id="recentHospitalizationError">Please select an option</span>

                  <div className="conditional-field" id="hospitalizationFields">
                    <div className="form-group">
                      <label htmlFor="hospitalizationReason">What was the reason? <span className="required">*</span></label>
                      <textarea id="hospitalizationReason" name="hospitalizationReason" rows="2" placeholder="Please describe..."></textarea>
                      <span className="field-error" id="hospitalizationReasonError">Please provide the reason</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Medical History */}
            <div className="section">
              <h2 className="section-title">Medical History</h2>
              <p style={{marginBottom: '1.5rem', color: 'var(--gray-700)', fontSize: '0.9375rem'}}>Please answer YES or NO for each condition.</p>

              {/* Cardiovascular */}
              <div className="condition-category" style={{backgroundColor: '#fef2f2', borderLeft: '4px solid #dc2626'}}>
                <h3 style={{color: '#991b1b'}}>❤️ Cardiovascular</h3>

                <div className="condition-item">
                  <label><strong>High Blood Pressure</strong> <span className="required">*</span></label>
                  <div className="radio-group" style={{marginBottom: '0.5rem'}}>
                    <div className="radio-item">
                      <input type="radio" id="hypertension_yes" name="hypertension" value="Yes" required className="condition-radio" />
                      <label htmlFor="hypertension_yes">Yes</label>
                    </div>
                    <div className="radio-item">
                      <input type="radio" id="hypertension_no" name="hypertension" value="No" className="condition-radio" />
                      <label htmlFor="hypertension_no">No</label>
                    </div>
                  </div>
                  <div className="condition-details" id="hypertension-details">
                    <div className="form-group">
                      <label htmlFor="hypertension-year">Year Diagnosed</label>
                      <input type="text" id="hypertension-year" name="hypertensionYear" placeholder="e.g., 2020" />
                    </div>
                  </div>
                </div>

                <div className="condition-item">
                  <label><strong>High Cholesterol</strong> <span className="required">*</span></label>
                  <div className="radio-group" style={{marginBottom: '0.5rem'}}>
                    <div className="radio-item">
                      <input type="radio" id="highCholesterol_yes" name="highCholesterol" value="Yes" required className="condition-radio" />
                      <label htmlFor="highCholesterol_yes">Yes</label>
                    </div>
                    <div className="radio-item">
                      <input type="radio" id="highCholesterol_no" name="highCholesterol" value="No" className="condition-radio" />
                      <label htmlFor="highCholesterol_no">No</label>
                    </div>
                  </div>
                  <div className="condition-details" id="highCholesterol-details">
                    <div className="form-group">
                      <label htmlFor="highCholesterol-year">Year Diagnosed</label>
                      <input type="text" id="highCholesterol-year" name="highCholesterolYear" placeholder="e.g., 2020" />
                    </div>
                  </div>
                </div>

                <div className="condition-item">
                  <label><strong>Heart Disease</strong> <span className="required">*</span></label>
                  <div className="radio-group" style={{marginBottom: '0.5rem'}}>
                    <div className="radio-item">
                      <input type="radio" id="heartDisease_yes" name="heartDisease" value="Yes" required className="condition-radio" />
                      <label htmlFor="heartDisease_yes">Yes</label>
                    </div>
                    <div className="radio-item">
                      <input type="radio" id="heartDisease_no" name="heartDisease" value="No" className="condition-radio" />
                      <label htmlFor="heartDisease_no">No</label>
                    </div>
                  </div>
                  <div className="condition-details" id="heartDisease-details">
                    <div className="form-row" style={{marginBottom: 0}}>
                      <div className="form-group">
                        <label htmlFor="heartDisease-type">Type</label>
                        <input type="text" id="heartDisease-type" name="heartDiseaseType" placeholder="e.g., CHF, CAD" />
                      </div>
                      <div className="form-group">
                        <label htmlFor="heartDisease-year">Year</label>
                        <input type="text" id="heartDisease-year" name="heartDiseaseYear" placeholder="e.g., 2020" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Metabolic */}
              <div className="condition-category" style={{backgroundColor: '#fef3c7', borderLeft: '4px solid #f59e0b'}}>
                <h3 style={{color: '#92400e'}}>⚡ Metabolic & Endocrine</h3>

                <div className="condition-item">
                  <label><strong>Diabetes</strong> <span className="required">*</span></label>
                  <div className="radio-group" style={{marginBottom: '0.5rem'}}>
                    <div className="radio-item">
                      <input type="radio" id="diabetes_yes" name="diabetes" value="Yes" required className="condition-radio" />
                      <label htmlFor="diabetes_yes">Yes</label>
                    </div>
                    <div className="radio-item">
                      <input type="radio" id="diabetes_no" name="diabetes" value="No" className="condition-radio" />
                      <label htmlFor="diabetes_no">No</label>
                    </div>
                  </div>
                  <div className="condition-details" id="diabetes-details">
                    <div className="form-row" style={{marginBottom: 0}}>
                      <div className="form-group">
                        <label htmlFor="diabetes-type">Type</label>
                        <select id="diabetes-type" name="diabetesType">
                          <option value="">Select...</option>
                          <option value="Type 1">Type 1</option>
                          <option value="Type 2">Type 2</option>
                          <option value="Pre-diabetes">Pre-diabetes</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label htmlFor="diabetes-year">Year</label>
                        <input type="text" id="diabetes-year" name="diabetesYear" placeholder="e.g., 2020" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="condition-item">
                  <label><strong>Thyroid Disorder</strong> <span className="required">*</span></label>
                  <div className="radio-group" style={{marginBottom: '0.5rem'}}>
                    <div className="radio-item">
                      <input type="radio" id="thyroid_yes" name="thyroid" value="Yes" required className="condition-radio" />
                      <label htmlFor="thyroid_yes">Yes</label>
                    </div>
                    <div className="radio-item">
                      <input type="radio" id="thyroid_no" name="thyroid" value="No" className="condition-radio" />
                      <label htmlFor="thyroid_no">No</label>
                    </div>
                  </div>
                  <div className="condition-details" id="thyroid-details">
                    <div className="form-row" style={{marginBottom: 0}}>
                      <div className="form-group">
                        <label htmlFor="thyroid-type">Type</label>
                        <select id="thyroid-type" name="thyroidType">
                          <option value="">Select...</option>
                          <option value="Hypothyroid">Hypothyroid</option>
                          <option value="Hyperthyroid">Hyperthyroid</option>
                          <option value="Hashimoto's">Hashimoto's</option>
                          <option value="Graves' Disease">Graves' Disease</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label htmlFor="thyroid-year">Year</label>
                        <input type="text" id="thyroid-year" name="thyroidYear" placeholder="e.g., 2020" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mental Health */}
              <div className="condition-category" style={{backgroundColor: '#ede9fe', borderLeft: '4px solid #8b5cf6'}}>
                <h3 style={{color: '#5b21b6'}}>🧠 Mental Health</h3>

                <div className="condition-item">
                  <label><strong>Depression / Anxiety</strong> <span className="required">*</span></label>
                  <div className="radio-group" style={{marginBottom: '0.5rem'}}>
                    <div className="radio-item">
                      <input type="radio" id="depression_yes" name="depression" value="Yes" required className="condition-radio" />
                      <label htmlFor="depression_yes">Yes</label>
                    </div>
                    <div className="radio-item">
                      <input type="radio" id="depression_no" name="depression" value="No" className="condition-radio" />
                      <label htmlFor="depression_no">No</label>
                    </div>
                  </div>
                  <div className="condition-details" id="depression-details">
                    <div className="form-group">
                      <label htmlFor="depression-year">Year Diagnosed</label>
                      <input type="text" id="depression-year" name="depressionYear" placeholder="e.g., 2020" />
                    </div>
                  </div>
                </div>

                <div className="condition-item">
                  <label><strong>Eating Disorder</strong> <span className="required">*</span></label>
                  <div className="radio-group" style={{marginBottom: '0.5rem'}}>
                    <div className="radio-item">
                      <input type="radio" id="eatingDisorder_yes" name="eatingDisorder" value="Yes" required className="condition-radio" />
                      <label htmlFor="eatingDisorder_yes">Yes</label>
                    </div>
                    <div className="radio-item">
                      <input type="radio" id="eatingDisorder_no" name="eatingDisorder" value="No" className="condition-radio" />
                      <label htmlFor="eatingDisorder_no">No</label>
                    </div>
                  </div>
                  <div className="condition-details" id="eatingDisorder-details">
                    <div className="form-group">
                      <label htmlFor="eatingDisorder-year">Year Diagnosed</label>
                      <input type="text" id="eatingDisorder-year" name="eatingDisorderYear" placeholder="e.g., 2020" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Organ Health */}
              <div className="condition-category" style={{backgroundColor: '#ecfdf5', borderLeft: '4px solid #10b981'}}>
                <h3 style={{color: '#047857'}}>🫀 Organ Health</h3>

                <div className="condition-item">
                  <label><strong>Kidney Disease</strong> <span className="required">*</span></label>
                  <div className="radio-group" style={{marginBottom: '0.5rem'}}>
                    <div className="radio-item">
                      <input type="radio" id="kidney_yes" name="kidney" value="Yes" required className="condition-radio" />
                      <label htmlFor="kidney_yes">Yes</label>
                    </div>
                    <div className="radio-item">
                      <input type="radio" id="kidney_no" name="kidney" value="No" className="condition-radio" />
                      <label htmlFor="kidney_no">No</label>
                    </div>
                  </div>
                  <div className="condition-details" id="kidney-details">
                    <div className="form-group">
                      <label htmlFor="kidney-year">Year Diagnosed</label>
                      <input type="text" id="kidney-year" name="kidneyYear" placeholder="e.g., 2020" />
                    </div>
                  </div>
                </div>

                <div className="condition-item">
                  <label><strong>Liver Disease</strong> <span className="required">*</span></label>
                  <div className="radio-group" style={{marginBottom: '0.5rem'}}>
                    <div className="radio-item">
                      <input type="radio" id="liver_yes" name="liver" value="Yes" required className="condition-radio" />
                      <label htmlFor="liver_yes">Yes</label>
                    </div>
                    <div className="radio-item">
                      <input type="radio" id="liver_no" name="liver" value="No" className="condition-radio" />
                      <label htmlFor="liver_no">No</label>
                    </div>
                  </div>
                  <div className="condition-details" id="liver-details">
                    <div className="form-group">
                      <label htmlFor="liver-year">Year Diagnosed</label>
                      <input type="text" id="liver-year" name="liverYear" placeholder="e.g., 2020" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Immune & Cancer */}
              <div className="condition-category" style={{backgroundColor: '#f3e8ff', borderLeft: '4px solid #a855f7'}}>
                <h3 style={{color: '#6b21a8'}}>🛡️ Immune & Cancer</h3>

                <div className="condition-item">
                  <label><strong>Autoimmune Disorder</strong> <span className="required">*</span></label>
                  <div className="radio-group" style={{marginBottom: '0.5rem'}}>
                    <div className="radio-item">
                      <input type="radio" id="autoimmune_yes" name="autoimmune" value="Yes" required className="condition-radio" />
                      <label htmlFor="autoimmune_yes">Yes</label>
                    </div>
                    <div className="radio-item">
                      <input type="radio" id="autoimmune_no" name="autoimmune" value="No" className="condition-radio" />
                      <label htmlFor="autoimmune_no">No</label>
                    </div>
                  </div>
                  <div className="condition-details" id="autoimmune-details">
                    <div className="form-row" style={{marginBottom: 0}}>
                      <div className="form-group">
                        <label htmlFor="autoimmune-type">Type</label>
                        <input type="text" id="autoimmune-type" name="autoimmuneType" placeholder="e.g., Lupus, RA" />
                      </div>
                      <div className="form-group">
                        <label htmlFor="autoimmune-year">Year</label>
                        <input type="text" id="autoimmune-year" name="autoimmuneYear" placeholder="e.g., 2020" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="condition-item">
                  <label><strong>Cancer</strong> <span className="required">*</span></label>
                  <div className="radio-group" style={{marginBottom: '0.5rem'}}>
                    <div className="radio-item">
                      <input type="radio" id="cancer_yes" name="cancer" value="Yes" required className="condition-radio" />
                      <label htmlFor="cancer_yes">Yes</label>
                    </div>
                    <div className="radio-item">
                      <input type="radio" id="cancer_no" name="cancer" value="No" className="condition-radio" />
                      <label htmlFor="cancer_no">No</label>
                    </div>
                  </div>
                  <div className="condition-details" id="cancer-details">
                    <div className="form-row" style={{marginBottom: 0}}>
                      <div className="form-group">
                        <label htmlFor="cancer-type">Type</label>
                        <input type="text" id="cancer-type" name="cancerType" placeholder="e.g., Breast, Prostate" />
                      </div>
                      <div className="form-group">
                        <label htmlFor="cancer-year">Year</label>
                        <input type="text" id="cancer-year" name="cancerYear" placeholder="e.g., 2020" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Medications & Allergies */}
            <div className="section">
              <h2 className="section-title">Medications & Allergies</h2>

              <div className="form-row">
                <div className="form-group full-width" style={{backgroundColor: '#dbeafe', border: '2px solid #3b82f6', padding: '1.5rem', borderRadius: '4px', marginBottom: '1.5rem'}}>
                  <label style={{fontSize: '1.125rem', fontWeight: 600, color: '#1e40af', marginBottom: '1rem', display: 'block'}}>Are you currently on Hormone Replacement Therapy (HRT)? <span className="required">*</span></label>
                  <div className="radio-group">
                    <div className="radio-item">
                      <input type="radio" id="onHRT_yes" name="onHRT" value="Yes" required />
                      <label htmlFor="onHRT_yes">Yes</label>
                    </div>
                    <div className="radio-item">
                      <input type="radio" id="onHRT_no" name="onHRT" value="No" />
                      <label htmlFor="onHRT_no">No</label>
                    </div>
                  </div>
                  <span className="field-error" id="onHRTError">Please select an option</span>

                  <div className="conditional-field" id="hrtFields">
                    <div className="form-group">
                      <label htmlFor="hrtDetails">Please describe your HRT regimen</label>
                      <textarea id="hrtDetails" name="hrtDetails" rows="2" placeholder="What are you taking? Dosage? How long?"></textarea>
                    </div>
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group full-width">
                  <label>Are you currently taking any other medications? <span className="required">*</span></label>
                  <div className="radio-group">
                    <div className="radio-item">
                      <input type="radio" id="onMedications_yes" name="onMedications" value="Yes" required />
                      <label htmlFor="onMedications_yes">Yes</label>
                    </div>
                    <div className="radio-item">
                      <input type="radio" id="onMedications_no" name="onMedications" value="No" />
                      <label htmlFor="onMedications_no">No</label>
                    </div>
                  </div>
                  <span className="field-error" id="onMedicationsError">Please select an option</span>

                  <div className="conditional-field" id="medicationsFields">
                    <div className="form-group">
                      <label htmlFor="currentMedications">Please list all medications <span className="required">*</span></label>
                      <textarea id="currentMedications" name="currentMedications" rows="3" placeholder="Include prescription medications, over-the-counter drugs, and supplements..."></textarea>
                      <span className="field-error" id="currentMedicationsError">Please list your medications</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group full-width">
                  <label>Do you have any known allergies? <span className="required">*</span></label>
                  <div className="radio-group">
                    <div className="radio-item">
                      <input type="radio" id="allergiesYes" name="hasAllergies" value="Yes" required />
                      <label htmlFor="allergiesYes">Yes</label>
                    </div>
                    <div className="radio-item">
                      <input type="radio" id="allergiesNo" name="hasAllergies" value="No" />
                      <label htmlFor="allergiesNo">No</label>
                    </div>
                  </div>
                  <span className="field-error" id="hasAllergiesError">Please select an option</span>

                  <div className="conditional-field" id="allergiesFields">
                    <div className="form-group">
                      <label htmlFor="allergiesList">Please list your allergies and reactions <span className="required">*</span></label>
                      <textarea id="allergiesList" name="allergiesList" rows="2" placeholder="e.g., Penicillin - rash, Shellfish - anaphylaxis"></textarea>
                      <span className="field-error" id="allergiesListError">Please list your allergies</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Photo ID Upload */}
            <div className="section">
              <h2 className="section-title">Photo ID</h2>
              <div className="form-row">
                <div className="form-group full-width">
                  <label htmlFor="photoId">Upload a photo of your government-issued ID <span className="required">*</span></label>
                  <div className="file-upload-container">
                    <input type="file" id="photoId" name="photoId" accept="image/*,.pdf" required style={{padding: '0.5rem 0'}} />
                    <span className="field-hint">Driver's license, state ID, or passport. File size limit: 10MB</span>
                    <span className="field-error" id="photoIdError">Photo ID is required</span>
                    <div className="file-preview" id="photoIdPreview">
                      <img id="photoIdPreviewImg" style={{display: 'none'}} alt="ID Preview" />
                      <div className="file-name" id="photoIdFileName"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Signature & Consent */}
            <div className="section">
              <h2 className="section-title">Signature & Consent</h2>

              <div style={{backgroundColor: 'var(--gray-50)', padding: '1rem', borderRadius: '4px', marginBottom: '1.5rem', fontSize: '0.875rem', color: 'var(--gray-700)'}}>
                <p style={{marginBottom: '0.5rem'}}><strong>By signing below, I certify that:</strong></p>
                <ul style={{marginLeft: '1.5rem', marginBottom: 0}}>
                  <li>The information I have provided is true and complete to the best of my knowledge.</li>
                  <li>I will inform Range Medical of any changes to my health status.</li>
                  <li>I authorize Range Medical to use this information to provide care.</li>
                  <li id="guardianConsentText" style={{display: 'none'}}>As the parent/legal guardian, I authorize Range Medical to provide care to the minor patient named above.</li>
                </ul>
              </div>

              <div className="form-group">
                <label id="signatureLabel">Patient Signature <span className="required">*</span></label>
                <div className="signature-container">
                  <canvas id="signatureCanvas" className="signature-canvas"></canvas>
                </div>
                <div className="signature-actions">
                  <button type="button" className="btn-clear" id="clearSignature">Clear Signature</button>
                </div>
                <span className="field-error" id="signatureError">Signature is required</span>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="signatureDate">Date <span className="required">*</span></label>
                  <input type="text" id="signatureDate" name="signatureDate" readOnly />
                </div>
              </div>
            </div>

            <div className="validation-summary" id="validationSummary">
              <h3>Please complete the following required fields:</h3>
              <ul id="validationList"></ul>
            </div>

            <button type="submit" className="btn-submit" id="submitBtn">Submit Medical Intake Form</button>
          </form>
        </div>

        {/* Thank You Screen */}
        <div className="thank-you-container" id="thankYouContainer">
          <div className="thank-you-icon">✓</div>
          <h2 className="thank-you-title">Thank You!</h2>
          <p className="thank-you-message">Your medical intake form has been submitted successfully.</p>

          <div className="thank-you-details">
            <p><strong>What happens next:</strong></p>
            <p>Our team will review your information before your appointment. If we have any questions, we'll reach out to you directly.</p>
            <p>If you have any questions, please call us at <a href="tel:9499973988">(949) 997-3988</a>.</p>
          </div>

          <div className="thank-you-footer">
            <p>RANGE MEDICAL</p>
          </div>
        </div>
      </div>
    </>
  );
}

function initializeForm() {
  // Initialize Supabase client for file uploads
  const supabaseClient = createClient(
    'https://teivfptpozltpqwahgdl.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );

  // Track uploaded file URLs
  let uploadedPhotoIdUrl = null;
  let uploadedSignatureUrl = null;
  let uploadedPdfUrl = null;

  // Set today's date
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
  document.getElementById('signatureDate').value = dateStr;

  // Initialize signature pad
  const canvas = document.getElementById('signatureCanvas');
  const signaturePad = new SignaturePad(canvas, {
    backgroundColor: 'rgb(255, 255, 255)',
    penColor: 'rgb(0, 0, 0)'
  });

  function resizeCanvas() {
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    canvas.getContext('2d').scale(ratio, ratio);
    signaturePad.clear();
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  document.getElementById('clearSignature').addEventListener('click', () => {
    signaturePad.clear();
  });

  window.signaturePad = signaturePad;

  // Initialize input masks
  if (typeof IMask !== 'undefined') {
    IMask(document.getElementById('phone'), { mask: '(000) 000-0000' });
    IMask(document.getElementById('dob'), { mask: '00/00/0000' });
  }

  // ============================================
  // FILE UPLOAD FUNCTIONS
  // ============================================
  
  async function uploadFileToStorage(file, folder, prefix) {
    try {
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(7);
      const extension = file.name.split('.').pop();
      const fileName = `${folder}/${prefix}-${timestamp}-${randomStr}.${extension}`;
      
      console.log('📤 Uploading to:', fileName);
      
      const { data, error } = await supabaseClient.storage
        .from('medical-documents')
        .upload(fileName, file, {
          contentType: file.type,
          cacheControl: '3600',
          upsert: false
        });
      
      if (error) throw error;
      
      const { data: { publicUrl } } = supabaseClient.storage
        .from('medical-documents')
        .getPublicUrl(fileName);
      
      console.log('✅ Uploaded:', publicUrl);
      return publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  }

  async function uploadBase64ToStorage(base64Data, folder, prefix, extension = 'png') {
    try {
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(7);
      const fileName = `${folder}/${prefix}-${timestamp}-${randomStr}.${extension}`;
      
      // Convert base64 to blob
      const base64Content = base64Data.split(',')[1];
      const mimeType = base64Data.split(';')[0].split(':')[1] || 'image/png';
      const byteCharacters = atob(base64Content);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });
      
      console.log('📤 Uploading base64 to:', fileName);
      
      const { data, error } = await supabaseClient.storage
        .from('medical-documents')
        .upload(fileName, blob, {
          contentType: mimeType,
          cacheControl: '3600',
          upsert: false
        });
      
      if (error) throw error;
      
      const { data: { publicUrl } } = supabaseClient.storage
        .from('medical-documents')
        .getPublicUrl(fileName);
      
      console.log('✅ Uploaded:', publicUrl);
      return publicUrl;
    } catch (error) {
      console.error('Base64 upload error:', error);
      throw error;
    }
  }

  async function uploadPdfToStorage(pdfBlob, patientName) {
    try {
      const timestamp = Date.now();
      const safeName = patientName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
      const fileName = `medical-intake/${safeName}-${timestamp}.pdf`;
      
      console.log('📤 Uploading PDF to:', fileName);
      
      const { data, error } = await supabaseClient.storage
        .from('medical-documents')
        .upload(fileName, pdfBlob, {
          contentType: 'application/pdf',
          cacheControl: '3600',
          upsert: false
        });
      
      if (error) throw error;
      
      const { data: { publicUrl } } = supabaseClient.storage
        .from('medical-documents')
        .getPublicUrl(fileName);
      
      console.log('✅ PDF uploaded:', publicUrl);
      return publicUrl;
    } catch (error) {
      console.error('PDF upload error:', error);
      throw error;
    }
  }

  // ============================================
  // GENERATE PDF
  // ============================================
  
  async function generatePDF(formData) {
    let jsPDF;
    if (window.jspdf && window.jspdf.jsPDF) {
      jsPDF = window.jspdf.jsPDF;
    } else if (window.jsPDF) {
      jsPDF = window.jsPDF;
    } else {
      throw new Error('jsPDF library not loaded');
    }
    
    const doc = new jsPDF({ compress: true });
    let yPos = 20;
    const leftMargin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const contentWidth = pageWidth - 40;
    
    function checkPageBreak(neededSpace = 20) {
      if (yPos + neededSpace > 270) {
        doc.addPage();
        yPos = 20;
      }
    }
    
    function addText(text, fontSize = 11, isBold = false) {
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', isBold ? 'bold' : 'normal');
      const lines = doc.splitTextToSize(String(text || ''), contentWidth);
      checkPageBreak(lines.length * fontSize * 0.4 + 5);
      doc.text(lines, leftMargin, yPos);
      yPos += (lines.length * fontSize * 0.4) + 2;
    }
    
    function addLabelValue(label, value) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(label, leftMargin, yPos);
      doc.setFont('helvetica', 'normal');
      const labelWidth = doc.getTextWidth(label) + 2;
      const valueLines = doc.splitTextToSize(String(value || 'N/A'), contentWidth - labelWidth - 10);
      doc.text(valueLines, leftMargin + labelWidth, yPos);
      yPos += (valueLines.length * 5) + 3;
      checkPageBreak();
    }
    
    function addSection(text) {
      checkPageBreak(15);
      yPos += 5;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(text, leftMargin, yPos);
      yPos += 2;
      doc.setLineWidth(0.5);
      doc.line(leftMargin, yPos, pageWidth - leftMargin, yPos);
      yPos += 8;
    }
    
    // Header
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('RANGE MEDICAL', pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('New Patient Medical Intake Form', pageWidth / 2, yPos, { align: 'center' });
    yPos += 6;
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('Submitted: ' + formData.signatureDate, pageWidth / 2, yPos, { align: 'center' });
    doc.setTextColor(0);
    yPos += 5;
    doc.setLineWidth(1);
    doc.line(leftMargin, yPos, pageWidth - leftMargin, yPos);
    yPos += 10;
    
    // Personal Info
    addSection('PERSONAL INFORMATION');
    addLabelValue('Legal Name: ', formData.firstName + ' ' + formData.lastName);
    if (formData.preferredName) addLabelValue('Preferred Name: ', formData.preferredName);
    addLabelValue('Gender: ', formData.gender);
    addLabelValue('Date of Birth: ', formData.dateOfBirth);
    addLabelValue('Phone: ', formData.phone);
    addLabelValue('Email: ', formData.email);
    addLabelValue('Address: ', `${formData.streetAddress}, ${formData.city}, ${formData.state} ${formData.postalCode}`);
    addLabelValue('How Heard About Us: ', formData.howHeardAboutUs);
    
    // Minor/Guardian
    if (formData.isMinor === 'Yes') {
      addSection('GUARDIAN INFORMATION');
      addLabelValue('Minor Patient: ', 'Yes');
      addLabelValue('Guardian Name: ', formData.guardianName);
      addLabelValue('Relationship: ', formData.guardianRelationship);
    }
    
    // Health Concerns
    addSection('HEALTH CONCERNS');
    addLabelValue('Currently Injured: ', formData.injured);
    if (formData.injured === 'Yes') {
      addLabelValue('Injury Description: ', formData.injuryDescription);
      addLabelValue('Injury Location: ', formData.injuryLocation);
      if (formData.injuryDate) addLabelValue('Injury Date: ', formData.injuryDate);
    }
    
    addLabelValue('Interested in Optimization: ', formData.interestedInOptimization);
    if (formData.interestedInOptimization === 'Yes' && formData.symptoms && formData.symptoms.length > 0) {
      addLabelValue('Symptoms: ', formData.symptoms.join(', '));
      if (formData.symptomDuration) addLabelValue('Symptom Duration: ', formData.symptomDuration);
    }
    
    if (formData.additionalNotes) {
      addLabelValue('Additional Notes: ', formData.additionalNotes);
    }
    
    // Healthcare Providers
    addSection('HEALTHCARE PROVIDERS');
    addLabelValue('Has PCP: ', formData.hasPCP);
    if (formData.hasPCP === 'Yes') {
      addLabelValue('PCP Name: ', formData.pcpName);
    }
    addLabelValue('Recent Hospitalization: ', formData.recentHospitalization);
    if (formData.recentHospitalization === 'Yes') {
      addLabelValue('Reason: ', formData.hospitalizationReason);
    }
    
    // Medical History
    addSection('MEDICAL HISTORY');
    const conditions = [
      { key: 'hypertension', label: 'High Blood Pressure' },
      { key: 'highCholesterol', label: 'High Cholesterol' },
      { key: 'heartDisease', label: 'Heart Disease' },
      { key: 'diabetes', label: 'Diabetes' },
      { key: 'thyroid', label: 'Thyroid Disorder' },
      { key: 'depression', label: 'Depression/Anxiety' },
      { key: 'eatingDisorder', label: 'Eating Disorder' },
      { key: 'kidney', label: 'Kidney Disease' },
      { key: 'liver', label: 'Liver Disease' },
      { key: 'autoimmune', label: 'Autoimmune Disorder' },
      { key: 'cancer', label: 'Cancer' }
    ];
    
    conditions.forEach(({ key, label }) => {
      const condition = formData.medicalHistory[key];
      if (condition) {
        let value = condition.response;
        if (condition.response === 'Yes') {
          if (condition.type) value += ` (Type: ${condition.type})`;
          if (condition.year) value += ` (Year: ${condition.year})`;
        }
        addLabelValue(label + ': ', value);
      }
    });
    
    // Medications
    addSection('MEDICATIONS & ALLERGIES');
    addLabelValue('On HRT: ', formData.onHRT);
    if (formData.onHRT === 'Yes' && formData.hrtDetails) {
      addLabelValue('HRT Details: ', formData.hrtDetails);
    }
    addLabelValue('On Other Medications: ', formData.onMedications);
    if (formData.onMedications === 'Yes' && formData.currentMedications) {
      addLabelValue('Medications: ', formData.currentMedications);
    }
    addLabelValue('Has Allergies: ', formData.hasAllergies);
    if (formData.hasAllergies === 'Yes' && formData.allergies) {
      addLabelValue('Allergies: ', formData.allergies);
    }
    
    // Signature
    addSection('CONSENT & SIGNATURE');
    addText('I certify that the information provided is true and complete to the best of my knowledge.');
    addText('I authorize Range Medical to use this information to provide care.');
    yPos += 5;
    addLabelValue('Date: ', formData.signatureDate);
    
    // Add signature image if available
    if (formData.signatureData && formData.signatureData.startsWith('data:')) {
      checkPageBreak(40);
      try {
        doc.addImage(formData.signatureData, 'PNG', leftMargin, yPos, 60, 25);
        yPos += 30;
      } catch (e) {
        console.error('Error adding signature to PDF:', e);
      }
    }
    
    // Footer
    yPos += 10;
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text('© 2026 Range Medical | Confidential Patient Information', pageWidth / 2, 285, { align: 'center' });
    
    return doc.output('blob');
  }

  // ============================================
  // PHOTO ID PREVIEW
  // ============================================
  
  document.getElementById('photoId').addEventListener('change', async function(e) {
    const file = e.target.files[0];
    const preview = document.getElementById('photoIdPreview');
    const previewImg = document.getElementById('photoIdPreviewImg');
    const fileName = document.getElementById('photoIdFileName');
    
    if (file) {
      preview.classList.add('visible');
      fileName.textContent = file.name + ' (Ready to upload)';
      
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(e) {
          previewImg.src = e.target.result;
          previewImg.style.display = 'block';
        };
        reader.readAsDataURL(file);
      } else {
        previewImg.style.display = 'none';
      }
    } else {
      preview.classList.remove('visible');
    }
  });

  // ============================================
  // CONDITIONAL FIELD TOGGLES
  // ============================================
  
  const howHeardSelect = document.getElementById('howHeardAboutUs');
  const howHeardOtherField = document.getElementById('howHeardOtherField');
  const howHeardFriendField = document.getElementById('howHeardFriendField');
  howHeardSelect.addEventListener('change', () => {
    howHeardOtherField.classList.toggle('visible', howHeardSelect.value === 'Other');
    howHeardFriendField.classList.toggle('visible', howHeardSelect.value === 'Friend or Family Member');
  });

  document.querySelectorAll('input[name="injured"]').forEach(radio => {
    radio.addEventListener('change', () => {
      document.getElementById('injuryFields').classList.toggle('visible', radio.value === 'Yes' && radio.checked);
    });
  });

  const symptomCheckboxes = document.querySelectorAll('input[id^="symptom_"]');
  const symptomDuration = document.getElementById('symptomDuration');

  symptomCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', () => {
      const symptomName = checkbox.id.replace('symptom_', '');
      const symptomItem = checkbox.closest('.symptom-item');
      const followup = document.getElementById('followup_' + symptomName);

      if (symptomItem) symptomItem.classList.toggle('selected', checkbox.checked);
      if (followup) followup.classList.toggle('visible', checkbox.checked);

      const anyChecked = Array.from(symptomCheckboxes).some(cb => cb.checked);
      symptomDuration.classList.toggle('visible', anyChecked);
    });
  });

  document.querySelectorAll('input[name="hasPCP"]').forEach(radio => {
    radio.addEventListener('change', () => {
      document.getElementById('pcpFields').classList.toggle('visible', radio.value === 'Yes' && radio.checked);
    });
  });

  document.querySelectorAll('input[name="recentHospitalization"]').forEach(radio => {
    radio.addEventListener('change', () => {
      document.getElementById('hospitalizationFields').classList.toggle('visible', radio.value === 'Yes' && radio.checked);
    });
  });

  document.querySelectorAll('input[name="onHRT"]').forEach(radio => {
    radio.addEventListener('change', () => {
      document.getElementById('hrtFields').classList.toggle('visible', radio.value === 'Yes' && radio.checked);
    });
  });

  document.querySelectorAll('input[name="onMedications"]').forEach(radio => {
    radio.addEventListener('change', () => {
      document.getElementById('medicationsFields').classList.toggle('visible', radio.value === 'Yes' && radio.checked);
    });
  });

  document.querySelectorAll('input[name="hasAllergies"]').forEach(radio => {
    radio.addEventListener('change', () => {
      document.getElementById('allergiesFields').classList.toggle('visible', radio.value === 'Yes' && radio.checked);
    });
  });

  document.querySelectorAll('input[name="isMinor"]').forEach(radio => {
    radio.addEventListener('change', () => {
      const isMinor = radio.value === 'Yes' && radio.checked;
      document.getElementById('guardianFieldsTop').classList.toggle('visible', isMinor);
      document.getElementById('guardianConsentText').style.display = isMinor ? 'list-item' : 'none';
      document.getElementById('signatureLabel').textContent = isMinor ? 'Parent/Guardian Signature *' : 'Patient Signature *';
      
      const libidoSymptom = document.getElementById('symptomLibido');
      if (libidoSymptom) {
        libidoSymptom.style.display = isMinor ? 'none' : 'block';
        if (isMinor) {
          const libidoCheckbox = document.getElementById('symptom_libido');
          if (libidoCheckbox) {
            libidoCheckbox.checked = false;
            libidoCheckbox.dispatchEvent(new Event('change'));
          }
        }
      }
    });
  });

  document.querySelectorAll('input[name="interestedInOptimization"]').forEach(radio => {
    radio.addEventListener('change', () => {
      const showSymptoms = radio.value === 'Yes' && radio.checked;
      const symptomSection = document.getElementById('symptomSection');
      if (symptomSection) {
        symptomSection.style.display = showSymptoms ? 'block' : 'none';
        if (!showSymptoms) {
          symptomCheckboxes.forEach(cb => {
            if (cb.checked) {
              cb.checked = false;
              cb.dispatchEvent(new Event('change'));
            }
          });
        }
      }
    });
  });

  document.querySelectorAll('.condition-radio').forEach(radio => {
    radio.addEventListener('change', () => {
      const conditionName = radio.name;
      const detailsEl = document.getElementById(conditionName + '-details');
      if (detailsEl) {
        detailsEl.classList.toggle('visible', radio.value === 'Yes' && radio.checked);
      }
    });
  });

  // Status message helper
  function showStatus(message, type) {
    const statusEl = document.getElementById('statusMessage');
    statusEl.textContent = message;
    statusEl.className = 'status-message visible ' + type;
  }

  // ============================================
  // FORM SUBMISSION
  // ============================================
  
  const form = document.getElementById('intakeForm');
  const submitBtn = document.getElementById('submitBtn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Clear previous errors
    document.querySelectorAll('.field-error').forEach(el => el.classList.remove('visible'));
    document.querySelectorAll('input.error, select.error, textarea.error').forEach(el => el.classList.remove('error'));
    document.querySelectorAll('.condition-item.has-error').forEach(el => el.classList.remove('has-error'));
    const summaryEl = document.getElementById('validationSummary');
    const listEl = document.getElementById('validationList');
    summaryEl.classList.remove('visible');
    listEl.innerHTML = '';

    let hasErrors = false;
    const missingFields = [];

    const validateField = (id, errorId, label) => {
      const field = document.getElementById(id);
      const error = document.getElementById(errorId);
      if (field && !field.value.trim()) {
        field.classList.add('error');
        if (error) error.classList.add('visible');
        hasErrors = true;
        if (label) missingFields.push(label);
      }
    };

    const validateRadio = (name, errorId, label) => {
      const radios = document.querySelectorAll(`input[name="${name}"]`);
      const checked = Array.from(radios).some(r => r.checked);
      if (!checked) {
        const error = document.getElementById(errorId);
        if (error) error.classList.add('visible');
        hasErrors = true;
        if (label) missingFields.push(label);
      }
    };

    // Validations
    validateField('firstName', 'firstNameError', 'First Name');
    validateField('lastName', 'lastNameError', 'Last Name');
    validateField('gender', 'genderError', 'Gender');
    validateField('dob', 'dobError', 'Date of Birth');
    validateField('phone', 'phoneError', 'Phone Number');
    validateField('email', 'emailError', 'Email Address');
    validateField('streetAddress', 'streetAddressError', 'Street Address');
    validateField('city', 'cityError', 'City');
    validateField('state', 'stateError', 'State');
    validateField('postalCode', 'postalCodeError', 'Postal Code');
    validateField('country', 'countryError', 'Country');
    validateField('howHeardAboutUs', 'howHeardAboutUsError', 'How did you hear about us');

    validateRadio('injured', 'injuredError', 'Are you dealing with an injury?');
    validateRadio('interestedInOptimization', 'interestedInOptimizationError', 'Interested in energy & optimization?');
    validateRadio('hasPCP', 'hasPCPError', 'Do you have a Primary Care Physician?');
    validateRadio('recentHospitalization', 'recentHospitalizationError', 'Hospitalized in the past year?');
    validateRadio('onHRT', 'onHRTError', 'Currently on HRT?');
    validateRadio('onMedications', 'onMedicationsError', 'Currently taking medications?');
    validateRadio('hasAllergies', 'hasAllergiesError', 'Any known allergies?');

    // Medical conditions validation
    const conditionLabels = {
      hypertension: 'High Blood Pressure',
      highCholesterol: 'High Cholesterol',
      heartDisease: 'Heart Disease',
      diabetes: 'Diabetes',
      thyroid: 'Thyroid Disorder',
      depression: 'Depression / Anxiety',
      eatingDisorder: 'Eating Disorder',
      kidney: 'Kidney Disease',
      liver: 'Liver Disease',
      autoimmune: 'Autoimmune Disorder',
      cancer: 'Cancer'
    };
    const unanswered = [];
    Object.entries(conditionLabels).forEach(([condition, label]) => {
      const radios = document.querySelectorAll(`input[name="${condition}"]`);
      const checked = Array.from(radios).some(r => r.checked);
      if (!checked) {
        hasErrors = true;
        unanswered.push(label);
        const radioEl = document.getElementById(condition + '_yes');
        if (radioEl) {
          const condItem = radioEl.closest('.condition-item');
          if (condItem) condItem.classList.add('has-error');
        }
      }
    });
    if (unanswered.length > 0) {
      missingFields.push('Medical History: ' + unanswered.join(', '));
    }

    // Conditional validations
    const injured = document.querySelector('input[name="injured"]:checked');
    if (injured && injured.value === 'Yes') {
      validateField('injuryDescription', 'injuryDescriptionError', 'Injury Description');
      validateField('injuryLocation', 'injuryLocationError', 'Injury Location');
    }

    const hasPCP = document.querySelector('input[name="hasPCP"]:checked');
    if (hasPCP && hasPCP.value === 'Yes') {
      validateField('pcpName', 'pcpNameError', 'Physician Name');
    }

    const recentHospital = document.querySelector('input[name="recentHospitalization"]:checked');
    if (recentHospital && recentHospital.value === 'Yes') {
      validateField('hospitalizationReason', 'hospitalizationReasonError', 'Hospitalization Reason');
    }

    const onMedications = document.querySelector('input[name="onMedications"]:checked');
    if (onMedications && onMedications.value === 'Yes') {
      validateField('currentMedications', 'currentMedicationsError', 'Current Medications List');
    }

    const hasAllergies = document.querySelector('input[name="hasAllergies"]:checked');
    if (hasAllergies && hasAllergies.value === 'Yes') {
      validateField('allergiesList', 'allergiesListError', 'Allergies List');
    }

    const isMinor = document.querySelector('input[name="isMinor"]:checked');
    if (isMinor && isMinor.value === 'Yes') {
      validateField('guardianName', 'guardianNameError', 'Parent/Guardian Name');
      validateField('guardianRelationship', 'guardianRelationshipError', 'Relationship to Patient');
    }

    // Photo ID validation
    const photoIdInput = document.getElementById('photoId');
    if (!photoIdInput.files || !photoIdInput.files[0]) {
      document.getElementById('photoIdError').classList.add('visible');
      hasErrors = true;
      missingFields.push('Photo ID');
    }

    // Signature validation
    if (window.signaturePad.isEmpty()) {
      document.getElementById('signatureError').classList.add('visible');
      hasErrors = true;
      missingFields.push('Signature');
    }

    if (hasErrors) {
      listEl.innerHTML = missingFields.map(f => '<li>' + f + '</li>').join('');
      summaryEl.classList.add('visible');
      summaryEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Processing...';
    showStatus('Submitting your form...', 'loading');

    try {
      const getValue = (id) => {
        const el = document.getElementById(id);
        return el ? el.value : '';
      };

      const getRadio = (name) => {
        const checked = document.querySelector(`input[name="${name}"]:checked`);
        return checked ? checked.value : '';
      };

      // Collect symptoms
      const symptoms = [];
      const symptomFollowups = {};
      symptomCheckboxes.forEach(cb => {
        if (cb.checked) {
          symptoms.push(cb.value);
          const symptomName = cb.id.replace('symptom_', '');
          const followupEl = document.querySelector(`#followup_${symptomName} select, #followup_${symptomName} input`);
          if (followupEl && followupEl.value) {
            symptomFollowups[symptomName] = followupEl.value;
          }
        }
      });

      // Collect medical history
      const conditionNames = ['hypertension', 'highCholesterol', 'heartDisease', 'diabetes', 'thyroid', 
                             'depression', 'eatingDisorder', 'kidney', 'liver', 'autoimmune', 'cancer'];
      
      const conditionLabels = {
        'hypertension': 'High Blood Pressure',
        'highCholesterol': 'High Cholesterol',
        'heartDisease': 'Heart Disease',
        'diabetes': 'Diabetes',
        'thyroid': 'Thyroid Disorder',
        'depression': 'Depression / Anxiety',
        'eatingDisorder': 'Eating Disorder',
        'kidney': 'Kidney Disease',
        'liver': 'Liver Disease',
        'autoimmune': 'Autoimmune Disorder',
        'cancer': 'Cancer'
      };

      const medicalHistory = {};
      conditionNames.forEach(conditionName => {
        const response = getRadio(conditionName);
        medicalHistory[conditionName] = {
          response: response,
          label: conditionLabels[conditionName]
        };
        
        if (response === 'Yes') {
          const yearEl = document.getElementById(conditionName + '-year');
          const typeEl = document.getElementById(conditionName + '-type');
          if (typeEl && typeEl.value) medicalHistory[conditionName].type = typeEl.value;
          if (yearEl && yearEl.value) medicalHistory[conditionName].year = yearEl.value;
        }
      });

      const patientName = `${getValue('firstName')}-${getValue('lastName')}`;

      // 1. Upload Photo ID
      showStatus('Uploading photo ID...', 'loading');
      const photoIdFile = photoIdInput.files[0];
      uploadedPhotoIdUrl = await uploadFileToStorage(photoIdFile, 'photo-ids', patientName);

      // 2. Upload Signature
      showStatus('Uploading signature...', 'loading');
      const signatureData = window.signaturePad.toDataURL();
      uploadedSignatureUrl = await uploadBase64ToStorage(signatureData, 'signatures', patientName, 'png');

      // Build form data object
      const formData = {
        firstName: getValue('firstName'),
        lastName: getValue('lastName'),
        preferredName: getValue('preferredName'),
        gender: getValue('gender'),
        dateOfBirth: getValue('dob'),
        email: getValue('email'),
        phone: getValue('phone'),
        streetAddress: getValue('streetAddress'),
        city: getValue('city'),
        state: getValue('state'),
        postalCode: getValue('postalCode'),
        country: getValue('country'),
        howHeardAboutUs: getValue('howHeardAboutUs') === 'Other' 
          ? `Other: ${getValue('howHeardOther')}` 
          : getValue('howHeardAboutUs'),
        injured: getRadio('injured'),
        injuryDescription: getValue('injuryDescription'),
        injuryLocation: getValue('injuryLocation'),
        injuryDate: getValue('injuryDate'),
        interestedInOptimization: getRadio('interestedInOptimization'),
        symptoms: symptoms,
        symptomFollowups: symptomFollowups,
        symptomDuration: getRadio('symptomDuration'),
        additionalNotes: getValue('additionalNotes'),
        hasPCP: getRadio('hasPCP'),
        pcpName: getValue('pcpName'),
        recentHospitalization: getRadio('recentHospitalization'),
        hospitalizationReason: getValue('hospitalizationReason'),
        medicalHistory: medicalHistory,
        onHRT: getRadio('onHRT'),
        hrtDetails: getValue('hrtDetails'),
        onMedications: getRadio('onMedications'),
        currentMedications: getValue('currentMedications'),
        hasAllergies: getRadio('hasAllergies'),
        allergies: getValue('allergiesList'),
        isMinor: getRadio('isMinor'),
        guardianName: getValue('guardianName'),
        guardianRelationship: getValue('guardianRelationship'),
        signatureDate: getValue('signatureDate'),
        signatureData: signatureData,
        consent: true,
        submittedAt: new Date().toISOString()
      };

      // 3. Generate PDF
      showStatus('Generating PDF...', 'loading');
      const pdfBlob = await generatePDF(formData);

      // 4. Upload PDF to Supabase
      showStatus('Uploading PDF...', 'loading');
      uploadedPdfUrl = await uploadPdfToStorage(pdfBlob, patientName);

      // Add URLs to form data (API will fetch PDF from URL for email attachment)
      formData.photoIdUrl = uploadedPhotoIdUrl;
      formData.signatureUrl = uploadedSignatureUrl;
      formData.pdfUrl = uploadedPdfUrl;

      // 5. Save to database
      showStatus('Saving to Range Medical system...', 'loading');
      const dbResponse = await fetch('/api/intakes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!dbResponse.ok) {
        const errorData = await dbResponse.json();
        throw new Error(errorData.details || 'Failed to save form');
      }

      // 6. Sync to GHL + Send email
      showStatus('Syncing to system...', 'loading');
      await fetch('/api/intake-to-ghl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      // Show thank you screen
      document.getElementById('intakeContainer').querySelector('.form-container').style.display = 'none';
      document.getElementById('intakeContainer').querySelector('.intake-header').style.display = 'none';
      document.getElementById('thankYouContainer').classList.add('visible');
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (error) {
      console.error('Submission error:', error);
      showStatus('Error: ' + (error.message || 'Unknown error occurred'), 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Medical Intake Form';
    }
  });
}
