import Head from 'next/head';
import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

export default function IntakeForm() {
  const [scriptsLoaded, setScriptsLoaded] = useState(0);
  const formInitialized = useRef(false);

  // Initialize form logic after all scripts load
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
        <meta name="description" content="Complete your new patient medical intake form for Range Medical. Secure, confidential patient information." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex, nofollow" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      {/* External Scripts */}
      <Script 
        src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js" 
        onLoad={handleScriptLoad}
      />
      <Script 
        src="https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js"
        onLoad={handleScriptLoad}
      />
      <Script 
        src="https://cdn.jsdelivr.net/npm/signature_pad@4.1.7/dist/signature_pad.umd.min.js"
        onLoad={handleScriptLoad}
      />
      <Script 
        src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"
        onLoad={handleScriptLoad}
      />

      <style jsx global>{`
        *, *::before, *::after {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        
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
            --gray-900: #171717;
            --error: #dc2626;
            --success: #16a34a;
        }
        
        html {
            font-size: 16px;
        }
        
        body {
            font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
            background-color: var(--gray-100);
            color: var(--gray-900);
            line-height: 1.6;
            min-height: 100vh;
        }
        
        .intake-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem 1.5rem;
        }
        
        .intake-header {
            text-align: center;
            margin-bottom: 2.5rem;
            padding-bottom: 2rem;
            border-bottom: 2px solid var(--black);
        }
        
        .clinic-name {
            font-size: 2.5rem;
            font-weight: 700;
            letter-spacing: 0.15em;
            margin-bottom: 0.5rem;
            color: var(--black);
        }
        
        .form-title {
            font-size: 1.25rem;
            font-weight: 600;
            letter-spacing: 0.05em;
            text-transform: uppercase;
            margin-top: 0.5rem;
            color: var(--gray-700);
        }
        
        .intake-header p {
            color: var(--gray-600);
            font-size: 0.875rem;
            margin-top: 0.5rem;
        }
        
        .form-container {
            background: var(--white);
            border: 2px solid var(--black);
            padding: 2rem;
        }
        
        .section {
            margin-bottom: 2.5rem;
            padding-bottom: 2rem;
            border-bottom: 1px solid var(--gray-200);
        }
        
        .section:last-of-type {
            border-bottom: none;
            margin-bottom: 0;
            padding-bottom: 0;
        }
        
        .section-title {
            font-size: 1.125rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            margin-bottom: 1.5rem;
            padding-bottom: 0.75rem;
            border-bottom: 2px solid var(--black);
            display: inline-block;
        }
        
        .form-row {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1.25rem;
            margin-bottom: 1.25rem;
        }
        
        .form-row:last-child {
            margin-bottom: 0;
        }
        
        .form-group {
            display: flex;
            flex-direction: column;
        }
        
        .form-group.full-width {
            grid-column: 1 / -1;
        }
        
        .intake-container label {
            font-size: 0.8125rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 0.5rem;
            color: var(--gray-700);
        }
        
        .intake-container label .required {
            color: var(--error);
            margin-left: 2px;
        }
        
        .intake-container input[type="text"],
        .intake-container input[type="email"],
        .intake-container input[type="tel"],
        .intake-container input[type="date"],
        .intake-container select,
        .intake-container textarea {
            width: 100%;
            padding: 0.75rem 1rem;
            font-size: 1rem;
            font-family: inherit;
            border: 1.5px solid var(--gray-300);
            background: var(--white);
            color: var(--gray-900);
            transition: border-color 0.2s ease, box-shadow 0.2s ease;
            border-radius: 0;
        }
        
        .intake-container input:focus,
        .intake-container select:focus,
        .intake-container textarea:focus {
            outline: none;
            border-color: var(--black);
            box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.1);
        }
        
        .intake-container input.error,
        .intake-container select.error,
        .intake-container textarea.error {
            border-color: var(--error);
        }
        
        .intake-container textarea {
            resize: vertical;
            min-height: 100px;
        }
        
        .intake-container select {
            cursor: pointer;
            appearance: none;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23525252' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
            background-repeat: no-repeat;
            background-position: right 1rem center;
            padding-right: 2.5rem;
        }
        
        .checkbox-group {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
            gap: 0.75rem;
        }
        
        .checkbox-item {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            cursor: pointer;
        }
        
        .checkbox-item input[type="checkbox"] {
            width: 1.25rem;
            height: 1.25rem;
            cursor: pointer;
            accent-color: var(--black);
        }
        
        .checkbox-item label {
            font-size: 0.9375rem;
            font-weight: 500;
            text-transform: none;
            letter-spacing: normal;
            margin-bottom: 0;
            cursor: pointer;
            color: var(--gray-800);
        }
        
        .radio-group {
            display: flex;
            gap: 1.5rem;
            flex-wrap: wrap;
        }
        
        .radio-item {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            cursor: pointer;
        }
        
        .radio-item input[type="radio"] {
            width: 1.25rem;
            height: 1.25rem;
            cursor: pointer;
            accent-color: var(--black);
        }
        
        .radio-item label {
            font-size: 0.9375rem;
            font-weight: 500;
            text-transform: none;
            letter-spacing: normal;
            margin-bottom: 0;
            cursor: pointer;
            color: var(--gray-800);
        }
        
        .conditional-field {
            display: none;
            margin-top: 1rem;
            padding-left: 1.75rem;
            border-left: 3px solid var(--gray-300);
        }
        
        .conditional-field.visible {
            display: block;
        }
        
        .condition-item {
            margin-bottom: 0.75rem;
            padding-bottom: 0.75rem;
            border-bottom: 1px solid var(--gray-100);
        }
        
        .condition-item:last-child {
            border-bottom: none;
            margin-bottom: 0;
            padding-bottom: 0;
        }
        
        .condition-details {
            display: none;
            margin-top: 0.75rem;
            margin-left: 1.75rem;
            padding: 1rem;
            background: var(--gray-50);
            border-left: 3px solid var(--gray-300);
        }
        
        .condition-details.visible {
            display: block;
        }
        
        .condition-details .form-group {
            margin-bottom: 0;
        }
        
        .condition-details .form-row {
            gap: 1rem;
        }
        
        .file-upload {
            position: relative;
        }
        
        .file-upload-input {
            position: absolute;
            width: 100%;
            height: 100%;
            opacity: 0;
            cursor: pointer;
        }
        
        .file-upload-label {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 2rem;
            border: 2px dashed var(--gray-300);
            background: var(--gray-50);
            text-align: center;
            cursor: pointer;
            transition: border-color 0.2s ease, background-color 0.2s ease;
        }
        
        .file-upload-label:hover {
            border-color: var(--black);
            background: var(--gray-100);
        }
        
        .file-upload-icon {
            font-size: 2rem;
            margin-bottom: 0.5rem;
        }
        
        .file-upload-text {
            font-size: 0.875rem;
            color: var(--gray-600);
        }
        
        .file-preview {
            margin-top: 1rem;
            display: none;
        }
        
        .file-preview.visible {
            display: block;
        }
        
        .file-preview img {
            max-width: 200px;
            max-height: 150px;
            border: 1px solid var(--gray-300);
        }
        
        .signature-container {
            border: 1.5px solid var(--gray-300);
            background: var(--white);
        }
        
        .signature-pad {
            width: 100%;
            height: 150px;
            display: block;
        }
        
        .signature-actions {
            display: flex;
            gap: 1rem;
            margin-top: 0.75rem;
        }
        
        .btn-clear {
            padding: 0.5rem 1rem;
            font-size: 0.875rem;
            font-weight: 600;
            background: var(--white);
            border: 1.5px solid var(--gray-400);
            cursor: pointer;
            transition: all 0.2s ease;
        }
        
        .btn-clear:hover {
            border-color: var(--black);
            background: var(--gray-100);
        }
        
        .consent-box {
            background: var(--gray-50);
            border: 1px solid var(--gray-200);
            padding: 1.5rem;
            margin-bottom: 1.5rem;
        }
        
        .consent-text {
            font-size: 0.9375rem;
            line-height: 1.7;
            color: var(--gray-700);
            margin-bottom: 1rem;
        }
        
        .submit-section {
            margin-top: 2.5rem;
            padding-top: 2rem;
            border-top: 2px solid var(--black);
        }
        
        .btn-submit {
            width: 100%;
            padding: 1.25rem 2rem;
            font-size: 1.125rem;
            font-weight: 700;
            font-family: inherit;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            background: var(--black);
            color: var(--white);
            border: none;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        
        .btn-submit:hover {
            background: var(--gray-800);
            transform: translateY(-1px);
        }
        
        .btn-submit:active {
            transform: translateY(0);
        }
        
        .btn-submit:disabled {
            background: var(--gray-400);
            cursor: not-allowed;
            transform: none;
        }
        
        .status-message {
            padding: 1rem;
            margin-top: 1rem;
            text-align: center;
            font-weight: 600;
            display: none;
        }
        
        .status-message.visible {
            display: block;
        }
        
        .status-message.success {
            background: #dcfce7;
            color: var(--success);
            border: 1px solid var(--success);
        }
        
        .status-message.error {
            background: #fee2e2;
            color: var(--error);
            border: 1px solid var(--error);
        }
        
        .status-message.loading {
            background: var(--gray-100);
            color: var(--gray-700);
            border: 1px solid var(--gray-300);
        }
        
        .field-error {
            font-size: 0.8125rem;
            color: var(--error);
            margin-top: 0.375rem;
            display: none;
        }
        
        .field-error.visible {
            display: block;
        }
        
        .intake-footer {
            text-align: center;
            margin-top: 2rem;
            padding-top: 1.5rem;
            font-size: 0.8125rem;
            color: var(--gray-500);
        }
        
        .thank-you-page {
            background: var(--white);
            border: 2px solid var(--black);
            padding: 3rem 2rem;
            text-align: center;
            max-width: 600px;
            margin: 2rem auto;
        }
        
        .thank-you-icon {
            width: 80px;
            height: 80px;
            background: var(--black);
            color: var(--white);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2.5rem;
            margin: 0 auto 1.5rem auto;
        }
        
        .thank-you-page h1 {
            font-size: 2rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
            color: var(--black);
        }
        
        .thank-you-subtitle {
            font-size: 1.125rem;
            color: var(--gray-600);
            margin-bottom: 2rem;
        }
        
        .thank-you-details {
            background: var(--gray-50);
            padding: 1.5rem;
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
        
        .thank-you-contact {
            margin-bottom: 2rem;
        }
        
        .thank-you-contact h3 {
            font-size: 1rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
            color: var(--gray-800);
        }
        
        .thank-you-contact a {
            color: var(--black);
            text-decoration: underline;
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
            
            .checkbox-group {
                grid-template-columns: 1fr;
            }
            
            .radio-group {
                flex-direction: column;
                gap: 0.75rem;
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
          <form id="intakeForm" noValidate>
            
            {/* Personal Information */}
            <div className="section">
              <h2 className="section-title">Personal Information</h2>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName">First Name <span className="required">*</span></label>
                  <input type="text" id="firstName" name="firstName" required />
                  <span className="field-error" id="firstNameError">First name is required</span>
                </div>
                <div className="form-group">
                  <label htmlFor="lastName">Last Name <span className="required">*</span></label>
                  <input type="text" id="lastName" name="lastName" required />
                  <span className="field-error" id="lastNameError">Last name is required</span>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="gender">Gender <span className="required">*</span></label>
                  <select id="gender" name="gender" required>
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Non-binary">Non-binary</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                    <option value="Other">Other</option>
                  </select>
                  <span className="field-error" id="genderError">Gender is required</span>
                </div>
                <div className="form-group">
                  <label htmlFor="dob">Date of Birth <span className="required">*</span></label>
                  <input type="text" id="dob" name="dob" placeholder="MM/DD/YYYY" maxLength="10" required />
                  <span className="field-error" id="dobError">Please enter a valid date (MM/DD/YYYY)</span>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="email">Email <span className="required">*</span></label>
                  <input type="email" id="email" name="email" required />
                  <span className="field-error" id="emailError">Valid email is required</span>
                </div>
                <div className="form-group">
                  <label htmlFor="phone">Phone <span className="required">*</span></label>
                  <input type="tel" id="phone" name="phone" placeholder="(555) 555-5555" required />
                  <span className="field-error" id="phoneError">Phone number is required</span>
                </div>
              </div>
              
              {/* NEW FIELD: How did you hear about us? */}
              <div className="form-row">
                <div className="form-group full-width">
                  <label htmlFor="howHeardAboutUs">How Did You Hear About Us? <span className="required">*</span></label>
                  <textarea id="howHeardAboutUs" name="howHeardAboutUs" rows="2" placeholder="Please tell us exactly how you heard about Range Medical (e.g., friend referral, Google search, Instagram, specific doctor referral, etc.)" required></textarea>
                  <span className="field-error" id="howHeardAboutUsError">Please let us know how you heard about us</span>
                </div>
              </div>
            </div>
            
            {/* Address */}
            <div className="section">
              <h2 className="section-title">Address</h2>
              
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
                  <label htmlFor="country">Country <span className="required">*</span></label>
                  <input type="text" id="country" name="country" defaultValue="United States" required />
                  <span className="field-error" id="countryError">Country is required</span>
                </div>
                <div className="form-group">
                  <label htmlFor="postalCode">Postal Code <span className="required">*</span></label>
                  <input type="text" id="postalCode" name="postalCode" required />
                  <span className="field-error" id="postalCodeError">Postal code is required</span>
                </div>
              </div>
            </div>
            
            {/* Health Concerns & Symptoms */}
            <div className="section">
              <h2 className="section-title">Health Concerns & Symptoms</h2>
              
              <div className="form-row">
                <div className="form-group full-width">
                  <label htmlFor="whatBringsYou">What Brings You In Today? <span className="required">*</span></label>
                  <textarea id="whatBringsYou" name="whatBringsYou" rows="4" placeholder="Please describe your health concerns, symptoms, or wellness goals..." required></textarea>
                  <span className="field-error" id="whatBringsYouError">This field is required</span>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group full-width">
                  <label>Are you injured? <span className="required">*</span></label>
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
                        <input type="text" id="injuryDate" name="injuryDate" placeholder="e.g., 2 weeks ago, January 2024" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Medical History */}
            <div className="section">
              <h2 className="section-title">Medical History</h2>
              <p style={{ marginBottom: '1.5rem', color: 'var(--gray-700)', fontSize: '0.9375rem' }}>Please answer YES or NO for each condition. If YES, provide details to help us serve you better.</p>
              
              {/* NEW FIELD: Primary Care Physician */}
              <div style={{ backgroundColor: '#ecfdf5', borderLeft: '4px solid #10b981', padding: '1rem', marginBottom: '1.5rem', borderRadius: '4px' }}>
                <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase', color: '#047857', letterSpacing: '0.5px' }}>👨‍⚕️ Primary Care Physician</h3>
                
                <div className="condition-item">
                  <label className="condition-label"><strong>Do you have a Primary Care Physician?</strong> <span className="required">*</span></label>
                  <div className="radio-group" style={{ marginBottom: '0.5rem' }}>
                    <div className="radio-item">
                      <input type="radio" id="hasPCP_yes" name="hasPCP" value="Yes" required />
                      <label htmlFor="hasPCP_yes">Yes</label>
                    </div>
                    <div className="radio-item">
                      <input type="radio" id="hasPCP_no" name="hasPCP" value="No" />
                      <label htmlFor="hasPCP_no">No</label>
                    </div>
                  </div>
                  <span className="field-error" id="hasPCPError">Please select an option</span>
                  
                  <div className="conditional-field" id="pcpFields">
                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                      <label htmlFor="pcpName">Physician Name <span className="required">*</span></label>
                      <input type="text" id="pcpName" name="pcpName" placeholder="Dr. First Last" />
                      <span className="field-error" id="pcpNameError">Please enter your physician's name</span>
                    </div>
                    <div className="form-row" style={{ marginBottom: 0 }}>
                      <div className="form-group">
                        <label htmlFor="pcpPractice">Practice/Clinic Name</label>
                        <input type="text" id="pcpPractice" name="pcpPractice" placeholder="e.g., Newport Family Medicine" />
                      </div>
                      <div className="form-group">
                        <label htmlFor="pcpPhone">Physician Phone</label>
                        <input type="tel" id="pcpPhone" name="pcpPhone" placeholder="(555) 555-5555" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* NEW FIELD: Recent Hospitalizations */}
              <div style={{ backgroundColor: '#fef2f2', borderLeft: '4px solid #ef4444', padding: '1rem', marginBottom: '1.5rem', borderRadius: '4px' }}>
                <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase', color: '#b91c1c', letterSpacing: '0.5px' }}>🏥 Recent Hospitalizations</h3>
                
                <div className="condition-item">
                  <label className="condition-label"><strong>Have you been hospitalized in the past year?</strong> <span className="required">*</span></label>
                  <div className="radio-group" style={{ marginBottom: '0.5rem' }}>
                    <div className="radio-item">
                      <input type="radio" id="recentHospitalization_yes" name="recentHospitalization" value="Yes" required />
                      <label htmlFor="recentHospitalization_yes">Yes</label>
                    </div>
                    <div className="radio-item">
                      <input type="radio" id="recentHospitalization_no" name="recentHospitalization" value="No" />
                      <label htmlFor="recentHospitalization_no">No</label>
                    </div>
                  </div>
                  <span className="field-error" id="recentHospitalizationError">Please select an option</span>
                  
                  <div className="conditional-field" id="hospitalizationFields">
                    <div className="form-group">
                      <label htmlFor="hospitalizationReason">What was the reason for your hospitalization? <span className="required">*</span></label>
                      <textarea id="hospitalizationReason" name="hospitalizationReason" rows="3" placeholder="Please describe the reason(s) for your hospitalization, including approximate dates if possible..."></textarea>
                      <span className="field-error" id="hospitalizationReasonError">Please describe the reason for your hospitalization</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Cardiovascular Conditions */}
              <div style={{ backgroundColor: '#fef2f2', borderLeft: '4px solid #dc2626', padding: '1rem', marginBottom: '1.5rem', borderRadius: '4px' }}>
                <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase', color: '#991b1b', letterSpacing: '0.5px' }}>❤️ Cardiovascular Conditions</h3>
                
                {/* Hypertension */}
                <div className="condition-item">
                  <label className="condition-label"><strong>High Blood Pressure (Hypertension)</strong> <span className="required">*</span></label>
                  <div className="radio-group" style={{ marginBottom: '0.5rem' }}>
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
                
                {/* High Cholesterol */}
                <div className="condition-item">
                  <label className="condition-label"><strong>High Cholesterol</strong> <span className="required">*</span></label>
                  <div className="radio-group" style={{ marginBottom: '0.5rem' }}>
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
                
                {/* Heart Disease */}
                <div className="condition-item">
                  <label className="condition-label"><strong>Heart Disease</strong> <span className="required">*</span></label>
                  <div className="radio-group" style={{ marginBottom: '0.5rem' }}>
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
                    <div className="form-row" style={{ marginBottom: 0 }}>
                      <div className="form-group">
                        <label htmlFor="heartDisease-type">Type of Heart Disease</label>
                        <input type="text" id="heartDisease-type" name="heartDiseaseType" placeholder="e.g., CHF, CAD, Valve Disease, Arrhythmia" />
                      </div>
                      <div className="form-group">
                        <label htmlFor="heartDisease-year">Year Diagnosed</label>
                        <input type="text" id="heartDisease-year" name="heartDiseaseYear" placeholder="e.g., 2020" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Metabolic & Endocrine Conditions */}
              <div style={{ backgroundColor: '#fef3c7', borderLeft: '4px solid #f59e0b', padding: '1rem', marginBottom: '1.5rem', borderRadius: '4px' }}>
                <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase', color: '#92400e', letterSpacing: '0.5px' }}>⚡ Metabolic & Endocrine Conditions</h3>
                
                {/* Diabetes */}
                <div className="condition-item">
                  <label className="condition-label"><strong>Diabetes</strong> <span className="required">*</span></label>
                  <div className="radio-group" style={{ marginBottom: '0.5rem' }}>
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
                    <div className="form-row" style={{ marginBottom: 0 }}>
                      <div className="form-group">
                        <label htmlFor="diabetes-type">Type of Diabetes</label>
                        <input type="text" id="diabetes-type" name="diabetesType" placeholder="Type 1, Type 2, or Gestational" />
                      </div>
                      <div className="form-group">
                        <label htmlFor="diabetes-year">Year Diagnosed</label>
                        <input type="text" id="diabetes-year" name="diabetesYear" placeholder="e.g., 2020" />
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Thyroid */}
                <div className="condition-item">
                  <label className="condition-label"><strong>Thyroid Disorder</strong> <span className="required">*</span></label>
                  <div className="radio-group" style={{ marginBottom: '0.5rem' }}>
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
                    <div className="form-row" style={{ marginBottom: 0 }}>
                      <div className="form-group">
                        <label htmlFor="thyroid-type">Type of Thyroid Disorder</label>
                        <input type="text" id="thyroid-type" name="thyroidType" placeholder="e.g., Hypothyroid, Hyperthyroid, Hashimoto's, Graves'" />
                      </div>
                      <div className="form-group">
                        <label htmlFor="thyroid-year">Year Diagnosed</label>
                        <input type="text" id="thyroid-year" name="thyroidYear" placeholder="e.g., 2020" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Mental Health Conditions */}
              <div style={{ backgroundColor: '#ede9fe', borderLeft: '4px solid #8b5cf6', padding: '1rem', marginBottom: '1.5rem', borderRadius: '4px' }}>
                <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase', color: '#5b21b6', letterSpacing: '0.5px' }}>🧠 Mental Health Conditions</h3>
                
                <div className="condition-item">
                  <label className="condition-label"><strong>Depression, Anxiety, or Other Mental Health Conditions</strong> <span className="required">*</span></label>
                  <div className="radio-group" style={{ marginBottom: '0.5rem' }}>
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
              </div>
              
              {/* Organ Health Conditions */}
              <div style={{ backgroundColor: '#dbeafe', borderLeft: '4px solid #3b82f6', padding: '1rem', marginBottom: '1.5rem', borderRadius: '4px' }}>
                <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase', color: '#1e40af', letterSpacing: '0.5px' }}>🫁 Organ Health Conditions</h3>
                
                {/* Kidney */}
                <div className="condition-item">
                  <label className="condition-label"><strong>Kidney Disease</strong> <span className="required">*</span></label>
                  <div className="radio-group" style={{ marginBottom: '0.5rem' }}>
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
                    <div className="form-row" style={{ marginBottom: 0 }}>
                      <div className="form-group">
                        <label htmlFor="kidney-type">Type of Kidney Disease</label>
                        <input type="text" id="kidney-type" name="kidneyType" placeholder="e.g., CKD, Kidney Stones, Polycystic Kidney Disease" />
                      </div>
                      <div className="form-group">
                        <label htmlFor="kidney-year">Year Diagnosed</label>
                        <input type="text" id="kidney-year" name="kidneyYear" placeholder="e.g., 2020" />
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Liver */}
                <div className="condition-item">
                  <label className="condition-label"><strong>Liver Disease</strong> <span className="required">*</span></label>
                  <div className="radio-group" style={{ marginBottom: '0.5rem' }}>
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
                    <div className="form-row" style={{ marginBottom: 0 }}>
                      <div className="form-group">
                        <label htmlFor="liver-type">Type of Liver Disease</label>
                        <input type="text" id="liver-type" name="liverType" placeholder="e.g., Fatty Liver, Hepatitis, Cirrhosis" />
                      </div>
                      <div className="form-group">
                        <label htmlFor="liver-year">Year Diagnosed</label>
                        <input type="text" id="liver-year" name="liverYear" placeholder="e.g., 2020" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Immune System & Cancer */}
              <div style={{ backgroundColor: '#f3e8ff', borderLeft: '4px solid #a855f7', padding: '1rem', marginBottom: '1.5rem', borderRadius: '4px' }}>
                <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase', color: '#6b21a8', letterSpacing: '0.5px' }}>🛡️ Immune System & Cancer</h3>
                
                {/* Autoimmune */}
                <div className="condition-item">
                  <label className="condition-label"><strong>Autoimmune Disorder</strong> <span className="required">*</span></label>
                  <div className="radio-group" style={{ marginBottom: '0.5rem' }}>
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
                    <div className="form-row" style={{ marginBottom: 0 }}>
                      <div className="form-group">
                        <label htmlFor="autoimmune-type">Type of Autoimmune Disorder</label>
                        <input type="text" id="autoimmune-type" name="autoimmuneType" placeholder="e.g., Lupus, Rheumatoid Arthritis, MS, Crohn's" />
                      </div>
                      <div className="form-group">
                        <label htmlFor="autoimmune-year">Year Diagnosed</label>
                        <input type="text" id="autoimmune-year" name="autoimmuneYear" placeholder="e.g., 2020" />
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Cancer */}
                <div className="condition-item">
                  <label className="condition-label"><strong>Cancer (Current or Past)</strong> <span className="required">*</span></label>
                  <div className="radio-group" style={{ marginBottom: '0.5rem' }}>
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
                    <div className="form-row" style={{ marginBottom: 0 }}>
                      <div className="form-group">
                        <label htmlFor="cancer-type">Type of Cancer</label>
                        <input type="text" id="cancer-type" name="cancerType" placeholder="e.g., Breast, Prostate, Lung, Skin" />
                      </div>
                      <div className="form-group">
                        <label htmlFor="cancer-year">Year Diagnosed</label>
                        <input type="text" id="cancer-year" name="cancerYear" placeholder="e.g., 2020" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Quick No Conditions Option */}
              <div style={{ backgroundColor: '#f0fdf4', border: '2px solid #22c55e', padding: '1rem', borderRadius: '4px', marginTop: '1.5rem' }}>
                <p style={{ margin: 0, color: '#15803d', fontSize: '0.9375rem' }}>
                  ✅ <strong>No Medical Conditions?</strong> If you answered NO to all conditions above, you're all set with this section!
                </p>
              </div>
            </div>
            
            {/* Medications & Allergies */}
            <div className="section">
              <h2 className="section-title">Medications & Allergies</h2>
              
              {/* HRT Question */}
              <div className="form-row">
                <div className="form-group full-width" style={{ backgroundColor: '#dbeafe', border: '2px solid #3b82f6', padding: '1.5rem', borderRadius: '4px', marginBottom: '2rem' }}>
                  <label style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1e40af', marginBottom: '1rem', display: 'block' }}>Are you currently on Hormone Replacement Therapy (HRT)? <span className="required">*</span></label>
                  <div className="radio-group">
                    <div className="radio-item">
                      <input type="radio" id="hrtYes" name="onHRT" value="Yes" required />
                      <label htmlFor="hrtYes">Yes</label>
                    </div>
                    <div className="radio-item">
                      <input type="radio" id="hrtNo" name="onHRT" value="No" />
                      <label htmlFor="hrtNo">No</label>
                    </div>
                  </div>
                  <span className="field-error" id="onHRTError">Please select an option</span>
                  
                  <div className="conditional-field" id="hrtFields" style={{ marginTop: '1rem' }}>
                    <div className="form-group">
                      <label htmlFor="hrtDetails">HRT Details <span className="required">*</span></label>
                      <textarea id="hrtDetails" name="hrtDetails" rows="2" placeholder="Please specify: type of HRT, dosage, frequency (e.g., Testosterone Cypionate 200mg weekly)"></textarea>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group full-width">
                  <label>Are you on any other Medications? <span className="required">*</span></label>
                  <div className="radio-group">
                    <div className="radio-item">
                      <input type="radio" id="medicationsYes" name="onMedications" value="Yes" required />
                      <label htmlFor="medicationsYes">Yes</label>
                    </div>
                    <div className="radio-item">
                      <input type="radio" id="medicationsNo" name="onMedications" value="No" />
                      <label htmlFor="medicationsNo">No</label>
                    </div>
                  </div>
                  <span className="field-error" id="onMedicationsError">Please select an option</span>
                  
                  <div className="conditional-field" id="medicationsFields">
                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                      <label htmlFor="currentMedications">Current Medications <span className="required">*</span></label>
                      <textarea id="currentMedications" name="currentMedications" rows="3" placeholder="List all current medications"></textarea>
                    </div>
                    <div className="form-group">
                      <label htmlFor="medicationNotes">Medication Notes</label>
                      <textarea id="medicationNotes" name="medicationNotes" rows="2" placeholder="Any additional notes about your medications..."></textarea>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group full-width">
                  <label>Do you have any allergies? <span className="required">*</span></label>
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
                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                      <label htmlFor="allergies">Allergies <span className="required">*</span></label>
                      <textarea id="allergies" name="allergies" rows="3" placeholder="List all allergies (type 'No' if none)"></textarea>
                    </div>
                    <div className="form-group">
                      <label htmlFor="allergyReactions">Allergy Reactions</label>
                      <textarea id="allergyReactions" name="allergyReactions" rows="2" placeholder="Describe reactions to allergens..."></textarea>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Identification */}
            <div className="section">
              <h2 className="section-title">Identification</h2>
              
              <div className="form-row">
                <div className="form-group full-width">
                  <label>Driver's License / Photo ID <span className="required">*</span></label>
                  <div className="file-upload">
                    <input type="file" id="photoId" name="photoId" className="file-upload-input" accept="image/*,.pdf" required />
                    <div className="file-upload-label">
                      <span className="file-upload-icon">📄</span>
                      <span className="file-upload-text">Click or drag to upload your ID</span>
                      <span className="file-upload-text" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>Accepted: JPG, PNG, PDF</span>
                    </div>
                  </div>
                  <div className="file-preview" id="idPreview">
                    <img id="idPreviewImg" alt="ID Preview" />
                    <p id="idFileName" style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginTop: '0.5rem' }}></p>
                  </div>
                  <span className="field-error" id="photoIdError">Photo ID is required</span>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group full-width">
                  <label htmlFor="guardianName">Parent/Guardian Name (if client is under 18)</label>
                  <input type="text" id="guardianName" name="guardianName" placeholder="Leave blank if not applicable" />
                </div>
              </div>
            </div>
            
            {/* Consent */}
            <div className="section">
              <h2 className="section-title">Consent & Acknowledgment</h2>
              
              <div className="consent-box">
                <p className="consent-text">
                  I consent to evaluation and wellness services provided by Range Medical staff under the supervision of the medical director. I understand some therapies may be used off-label and that individual results can vary. I authorize Range Medical to contact me via the methods provided above. I acknowledge responsibility for payment for services rendered and have reviewed any posted cancellation/no-show policies.
                </p>
                
                <div className="radio-group">
                  <div className="radio-item">
                    <input type="radio" id="consentYes" name="consent" value="Yes" required />
                    <label htmlFor="consentYes">Yes, I agree</label>
                  </div>
                  <div className="radio-item">
                    <input type="radio" id="consentNo" name="consent" value="No" />
                    <label htmlFor="consentNo">No, I do not agree</label>
                  </div>
                </div>
                <span className="field-error" id="consentError">Consent is required to proceed</span>
              </div>
              
              <div className="form-row">
                <div className="form-group full-width">
                  <label>Patient or Guardian Signature <span className="required">*</span></label>
                  <div className="signature-container">
                    <canvas id="signaturePad" className="signature-pad"></canvas>
                  </div>
                  <div className="signature-actions">
                    <button type="button" className="btn-clear" id="clearSignature">Clear Signature</button>
                  </div>
                  <span className="field-error" id="signatureError">Signature is required</span>
                </div>
              </div>
            </div>
            
            {/* Submit */}
            <div className="submit-section">
              <button type="submit" className="btn-submit" id="submitBtn">
                Submit Intake Form
              </button>
              
              <div className="status-message" id="statusMessage"></div>
            </div>
          </form>
        </div>
        
        <footer className="intake-footer">
          <p>© 2025 Range Medical. All rights reserved.</p>
          <p style={{ marginTop: '0.5rem' }}>Your information is protected and kept confidential.</p>
        </footer>
      </div>
    </>
  );
}

// Initialize form function - called after all scripts load
function initializeForm() {
  if (typeof window === 'undefined') return;
  
  // ============================================
  // SUPABASE CONFIGURATION
  // ============================================
  
  const SUPABASE_CONFIG = {
    url: 'https://teivfptpozltpqwahgdl.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlaXZmcHRwb3psdHBxd2FoZ2RsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3MTMxNDksImV4cCI6MjA4MDI4OTE0OX0.NrI1AykMBOh91mM9BFvpSH0JwzGrkv5ADDkZinh0elc'
  };
  
  // Initialize Supabase client
  const { createClient } = window.supabase;
  const supabaseClient = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
  
  // ============================================
  // CONFIGURATION
  // ============================================
  
  const CONFIG = {
    apiEndpoint: '/api/intakes',
    ghlEndpoint: '/api/intake-to-ghl',
    emailjs: {
      publicKey: 'ZeNFfwJ37Uhd6E1vp',
      serviceId: 'service_pyl6wra',
      templateId: 'template_3pfsl9b'
    },
    ghl: {
      customFieldKey: 'intake_complete',
      tags: ['intake-submitted', 'new-patient']
    },
    recipientEmail: 'cupp@range-medical.com, intake@range-medical.com',
    clinicName: 'Range Medical',
    clinicAddress: '1901 Westcliff Dr. Suite 10, Newport Beach, CA 92660',
    clinicPhone: '(949) 997-3988'
  };
  
  // ============================================
  // SIGNATURE PAD INITIALIZATION
  // ============================================
  
  const canvas = document.getElementById('signaturePad');
  if (!canvas) return;
  
  const signaturePad = new window.SignaturePad(canvas, {
    backgroundColor: 'rgb(255, 255, 255)',
    penColor: 'rgb(0, 0, 0)'
  });
  
  function resizeCanvas() {
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const container = canvas.parentElement;
    canvas.width = container.offsetWidth * ratio;
    canvas.height = 150 * ratio;
    canvas.getContext('2d').scale(ratio, ratio);
    canvas.style.width = '100%';
    canvas.style.height = '150px';
    signaturePad.clear();
  }
  
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();
  
  document.getElementById('clearSignature')?.addEventListener('click', function() {
    signaturePad.clear();
  });
  
  // ============================================
  // CONDITIONAL FIELDS
  // ============================================
  
  // Medical condition radio buttons
  document.querySelectorAll('.condition-radio').forEach(radio => {
    radio.addEventListener('change', function() {
      const conditionName = this.name;
      const detailsEl = document.getElementById(conditionName + '-details');
      
      if (detailsEl) {
        if (this.value === 'Yes') {
          detailsEl.style.display = 'block';
        } else {
          detailsEl.style.display = 'none';
          detailsEl.querySelectorAll('input, textarea').forEach(input => {
            input.value = '';
          });
        }
      }
    });
  });
  
  // Injury conditional fields
  document.querySelectorAll('input[name="injured"]').forEach(radio => {
    radio.addEventListener('change', function() {
      const field = document.getElementById('injuryFields');
      if (this.value === 'Yes') {
        field.classList.add('visible');
      } else {
        field.classList.remove('visible');
        document.getElementById('injuryDescription').value = '';
        document.getElementById('injuryLocation').value = '';
        document.getElementById('injuryDate').value = '';
      }
    });
  });
  
  // HRT conditional field
  document.querySelectorAll('input[name="onHRT"]').forEach(radio => {
    radio.addEventListener('change', function() {
      const field = document.getElementById('hrtFields');
      if (this.value === 'Yes') {
        field.classList.add('visible');
      } else {
        field.classList.remove('visible');
        document.getElementById('hrtDetails').value = '';
      }
    });
  });
  
  // Medications conditional field
  document.querySelectorAll('input[name="onMedications"]').forEach(radio => {
    radio.addEventListener('change', function() {
      const field = document.getElementById('medicationsFields');
      if (this.value === 'Yes') {
        field.classList.add('visible');
      } else {
        field.classList.remove('visible');
      }
    });
  });
  
  // Allergies conditional field
  document.querySelectorAll('input[name="hasAllergies"]').forEach(radio => {
    radio.addEventListener('change', function() {
      const field = document.getElementById('allergiesFields');
      if (this.value === 'Yes') {
        field.classList.add('visible');
      } else {
        field.classList.remove('visible');
      }
    });
  });
  
  // NEW: Primary Care Physician conditional field
  document.querySelectorAll('input[name="hasPCP"]').forEach(radio => {
    radio.addEventListener('change', function() {
      const field = document.getElementById('pcpFields');
      if (this.value === 'Yes') {
        field.classList.add('visible');
      } else {
        field.classList.remove('visible');
        document.getElementById('pcpName').value = '';
        document.getElementById('pcpPractice').value = '';
        document.getElementById('pcpPhone').value = '';
      }
    });
  });
  
  // NEW: Recent Hospitalization conditional field
  document.querySelectorAll('input[name="recentHospitalization"]').forEach(radio => {
    radio.addEventListener('change', function() {
      const field = document.getElementById('hospitalizationFields');
      if (this.value === 'Yes') {
        field.classList.add('visible');
      } else {
        field.classList.remove('visible');
        document.getElementById('hospitalizationReason').value = '';
      }
    });
  });
  
  // ============================================
  // FILE UPLOAD PREVIEW & STORAGE
  // ============================================
  
  let uploadedPhotoIdUrl = null;
  let uploadedSignatureUrl = null;
  
  async function uploadFileToStorage(file, folder, filePrefix) {
    try {
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(7);
      const extension = file.name.split('.').pop();
      const fileName = `${folder}/${filePrefix}-${timestamp}-${randomStr}.${extension}`;
      
      const { data, error } = await supabaseClient.storage
        .from('intake-files')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (error) throw error;
      
      const { data: { publicUrl } } = supabaseClient.storage
        .from('intake-files')
        .getPublicUrl(fileName);
      
      return publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }
  
  document.getElementById('photoId')?.addEventListener('change', async function(e) {
    const file = e.target.files[0];
    const preview = document.getElementById('idPreview');
    const previewImg = document.getElementById('idPreviewImg');
    const fileName = document.getElementById('idFileName');
    
    if (file) {
      preview.classList.add('visible');
      fileName.textContent = file.name + ' (Uploading...)';
      
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
      
      try {
        uploadedPhotoIdUrl = await uploadFileToStorage(file, 'photo-ids', 'id');
        fileName.textContent = file.name + ' ✓ Uploaded';
        fileName.style.color = '#16a34a';
      } catch (error) {
        fileName.textContent = file.name + ' ✗ Upload failed';
        fileName.style.color = '#dc2626';
        uploadedPhotoIdUrl = null;
      }
    } else {
      preview.classList.remove('visible');
      uploadedPhotoIdUrl = null;
    }
  });
  
  async function uploadSignature() {
    if (signaturePad.isEmpty()) return null;
    
    try {
      const dataUrl = signaturePad.toDataURL('image/png');
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(7);
      const file = new File([blob], `signature-${timestamp}-${randomStr}.png`, { type: 'image/png' });
      
      return await uploadFileToStorage(file, 'signatures', 'sig');
    } catch (error) {
      console.error('Error uploading signature:', error);
      return null;
    }
  }
  
  // ============================================
  // UPLOAD PDF TO SUPABASE
  // ============================================
  
  async function uploadPDFToSupabase(pdfBlob, formData) {
    try {
      const timestamp = Date.now();
      const safeName = `${formData.firstName}-${formData.lastName}`.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const fileName = `medical-intake/${safeName}-${timestamp}.pdf`;
      
      const { data, error } = await supabaseClient.storage
        .from('medical-documents')
        .upload(fileName, pdfBlob, {
          contentType: 'application/pdf',
          upsert: false
        });
      
      if (error) {
        console.error('PDF upload error:', error);
        return null;
      }
      
      const { data: urlData } = supabaseClient.storage
        .from('medical-documents')
        .getPublicUrl(fileName);
      
      console.log('✅ PDF uploaded:', urlData.publicUrl);
      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading PDF:', error);
      return null;
    }
  }
  
  // ============================================
  // PHONE NUMBER FORMATTING
  // ============================================
  
  document.getElementById('phone')?.addEventListener('input', function(e) {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 0) {
      if (value.length <= 3) {
        value = '(' + value;
      } else if (value.length <= 6) {
        value = '(' + value.slice(0, 3) + ') ' + value.slice(3);
      } else {
        value = '(' + value.slice(0, 3) + ') ' + value.slice(3, 6) + '-' + value.slice(6, 10);
      }
    }
    e.target.value = value;
  });
  
  // NEW: PCP Phone formatting
  document.getElementById('pcpPhone')?.addEventListener('input', function(e) {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 0) {
      if (value.length <= 3) {
        value = '(' + value;
      } else if (value.length <= 6) {
        value = '(' + value.slice(0, 3) + ') ' + value.slice(3);
      } else {
        value = '(' + value.slice(0, 3) + ') ' + value.slice(3, 6) + '-' + value.slice(6, 10);
      }
    }
    e.target.value = value;
  });
  
  // ============================================
  // DATE OF BIRTH AUTO-FORMATTING
  // ============================================
  
  document.getElementById('dob')?.addEventListener('input', function(e) {
    let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
    
    if (value.length >= 2) {
      value = value.slice(0, 2) + '/' + value.slice(2);
    }
    if (value.length >= 5) {
      value = value.slice(0, 5) + '/' + value.slice(5);
    }
    if (value.length > 10) {
      value = value.slice(0, 10);
    }
    
    e.target.value = value;
  });

  // Validate DOB format
  function isValidDOB(dateStr) {
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return false;
    
    const [month, day, year] = dateStr.split('/').map(Number);
    const date = new Date(year, month - 1, day);
    
    return date.getFullYear() === year && 
           date.getMonth() === month - 1 && 
           date.getDate() === day &&
           year >= 1900 && year <= new Date().getFullYear();
  }
  
  // ============================================
  // FORM VALIDATION
  // ============================================
  
  function validateForm() {
    let isValid = true;
    
    const requiredFields = [
      { id: 'firstName', error: 'firstNameError' },
      { id: 'lastName', error: 'lastNameError' },
      { id: 'gender', error: 'genderError' },
      { id: 'email', error: 'emailError' },
      { id: 'phone', error: 'phoneError' },
      { id: 'streetAddress', error: 'streetAddressError' },
      { id: 'city', error: 'cityError' },
      { id: 'state', error: 'stateError' },
      { id: 'country', error: 'countryError' },
      { id: 'postalCode', error: 'postalCodeError' },
      { id: 'whatBringsYou', error: 'whatBringsYouError' },
      { id: 'howHeardAboutUs', error: 'howHeardAboutUsError' }  // NEW FIELD
    ];
    
    requiredFields.forEach(field => {
      const input = document.getElementById(field.id);
      const error = document.getElementById(field.error);
      
      if (!input.value.trim()) {
        input.classList.add('error');
        error.classList.add('visible');
        isValid = false;
      } else {
        input.classList.remove('error');
        error.classList.remove('visible');
      }
    });
    
    const email = document.getElementById('email');
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email.value && !emailPattern.test(email.value)) {
      email.classList.add('error');
      document.getElementById('emailError').classList.add('visible');
      isValid = false;
    }
    
    // Validate DOB separately
    const dob = document.getElementById('dob');
    const dobError = document.getElementById('dobError');
    if (!dob.value.trim() || !isValidDOB(dob.value)) {
      dob.classList.add('error');
      if (dobError) dobError.classList.add('visible');
      isValid = false;
    } else {
      dob.classList.remove('error');
      if (dobError) dobError.classList.remove('visible');
    }
    
    const radioGroups = [
      { name: 'injured', error: 'injuredError' },
      { name: 'onMedications', error: 'onMedicationsError' },
      { name: 'hasAllergies', error: 'hasAllergiesError' },
      { name: 'consent', error: 'consentError' },
      { name: 'hasPCP', error: 'hasPCPError' },  // NEW FIELD
      { name: 'recentHospitalization', error: 'recentHospitalizationError' }  // NEW FIELD
    ];
    
    radioGroups.forEach(group => {
      const checked = document.querySelector(`input[name="${group.name}"]:checked`);
      const error = document.getElementById(group.error);
      
      if (!checked) {
        error.classList.add('visible');
        isValid = false;
      } else {
        error.classList.remove('visible');
      }
    });
    
    const consent = document.querySelector('input[name="consent"]:checked');
    if (consent && consent.value === 'No') {
      document.getElementById('consentError').classList.add('visible');
      document.getElementById('consentError').textContent = 'You must consent to proceed';
      isValid = false;
    }
    
    const injured = document.querySelector('input[name="injured"]:checked');
    if (injured && injured.value === 'Yes') {
      const injuryDescription = document.getElementById('injuryDescription');
      const injuryLocation = document.getElementById('injuryLocation');
      
      if (!injuryDescription.value.trim()) {
        injuryDescription.classList.add('error');
        document.getElementById('injuryDescriptionError').classList.add('visible');
        isValid = false;
      } else {
        injuryDescription.classList.remove('error');
        document.getElementById('injuryDescriptionError').classList.remove('visible');
      }
      
      if (!injuryLocation.value.trim()) {
        injuryLocation.classList.add('error');
        document.getElementById('injuryLocationError').classList.add('visible');
        isValid = false;
      } else {
        injuryLocation.classList.remove('error');
        document.getElementById('injuryLocationError').classList.remove('visible');
      }
    }
    
    // NEW: Validate PCP name if hasPCP is Yes
    const hasPCP = document.querySelector('input[name="hasPCP"]:checked');
    if (hasPCP && hasPCP.value === 'Yes') {
      const pcpName = document.getElementById('pcpName');
      if (!pcpName.value.trim()) {
        pcpName.classList.add('error');
        document.getElementById('pcpNameError').classList.add('visible');
        isValid = false;
      } else {
        pcpName.classList.remove('error');
        document.getElementById('pcpNameError').classList.remove('visible');
      }
    }
    
    // NEW: Validate hospitalization reason if recentHospitalization is Yes
    const recentHosp = document.querySelector('input[name="recentHospitalization"]:checked');
    if (recentHosp && recentHosp.value === 'Yes') {
      const hospReason = document.getElementById('hospitalizationReason');
      if (!hospReason.value.trim()) {
        hospReason.classList.add('error');
        document.getElementById('hospitalizationReasonError').classList.add('visible');
        isValid = false;
      } else {
        hospReason.classList.remove('error');
        document.getElementById('hospitalizationReasonError').classList.remove('visible');
      }
    }
    
    const photoId = document.getElementById('photoId');
    if (!photoId.files || !photoId.files[0]) {
      document.getElementById('photoIdError').classList.add('visible');
      isValid = false;
    } else {
      document.getElementById('photoIdError').classList.remove('visible');
    }
    
    if (signaturePad.isEmpty()) {
      document.getElementById('signatureError').classList.add('visible');
      isValid = false;
    } else {
      document.getElementById('signatureError').classList.remove('visible');
    }
    
    const onMeds = document.querySelector('input[name="onMedications"]:checked');
    if (onMeds && onMeds.value === 'Yes') {
      const currentMeds = document.getElementById('currentMedications');
      if (!currentMeds.value.trim()) {
        currentMeds.classList.add('error');
        isValid = false;
      }
    }
    
    const hasAllergies = document.querySelector('input[name="hasAllergies"]:checked');
    if (hasAllergies && hasAllergies.value === 'Yes') {
      const allergies = document.getElementById('allergies');
      if (!allergies.value.trim()) {
        allergies.classList.add('error');
        isValid = false;
      }
    }
    
    return isValid;
  }
  
  // ============================================
  // COLLECT FORM DATA
  // ============================================
  
  async function collectFormData() {
    const getValue = (id) => document.getElementById(id)?.value || '';
    const getRadio = (name) => document.querySelector(`input[name="${name}"]:checked`)?.value || '';
    
    const conditionsList = [];
    const conditionNames = ['hypertension', 'highCholesterol', 'heartDisease', 
                           'diabetes', 'thyroid', 'depression', 
                           'kidney', 'liver', 'autoimmune', 'cancer'];
    
    const conditionLabels = {
      'hypertension': 'High Blood Pressure (Hypertension)',
      'highCholesterol': 'High Cholesterol',
      'heartDisease': 'Heart Disease',
      'diabetes': 'Diabetes',
      'thyroid': 'Thyroid Disorder',
      'depression': 'Depression / Anxiety',
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
        
        if (typeEl && typeEl.value) {
          medicalHistory[conditionName].type = typeEl.value;
        }
        if (yearEl && yearEl.value) {
          medicalHistory[conditionName].year = yearEl.value;
        }
        
        let conditionInfo = conditionLabels[conditionName];
        if (typeEl && typeEl.value) {
          conditionInfo += ` (Type: ${typeEl.value}`;
          if (yearEl && yearEl.value) {
            conditionInfo += `, Diagnosed: ${yearEl.value})`;
          } else {
            conditionInfo += ')';
          }
        } else if (yearEl && yearEl.value) {
          conditionInfo += ` (Diagnosed: ${yearEl.value})`;
        }
        conditionsList.push(conditionInfo);
      }
    });
    
    const conditions = conditionsList.length > 0 ? conditionsList.join('; ') : 'None';
    
    let photoIdBase64 = null;
    const photoIdInput = document.getElementById('photoId');
    if (photoIdInput.files && photoIdInput.files[0]) {
      const file = photoIdInput.files[0];
      photoIdBase64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
    }
    
    return {
      firstName: getValue('firstName'),
      lastName: getValue('lastName'),
      gender: getValue('gender'),
      dateOfBirth: getValue('dob'),
      email: getValue('email'),
      phone: getValue('phone'),
      streetAddress: getValue('streetAddress'),
      city: getValue('city'),
      state: getValue('state'),
      country: getValue('country'),
      postalCode: getValue('postalCode'),
      // NEW FIELD
      howHeardAboutUs: getValue('howHeardAboutUs'),
      whatBringsYou: getValue('whatBringsYou'),
      injured: getRadio('injured'),
      injuryDescription: getValue('injuryDescription'),
      injuryLocation: getValue('injuryLocation'),
      injuryDate: getValue('injuryDate'),
      // NEW FIELDS - Primary Care Physician
      hasPCP: getRadio('hasPCP'),
      pcpName: getValue('pcpName'),
      pcpPractice: getValue('pcpPractice'),
      pcpPhone: getValue('pcpPhone'),
      // NEW FIELDS - Recent Hospitalization
      recentHospitalization: getRadio('recentHospitalization'),
      hospitalizationReason: getValue('hospitalizationReason'),
      conditions: conditions,
      medicalHistory: medicalHistory,
      onHRT: getRadio('onHRT'),
      hrtDetails: getValue('hrtDetails'),
      onMedications: getRadio('onMedications'),
      currentMedications: getValue('currentMedications'),
      medicationNotes: getValue('medicationNotes'),
      hasAllergies: getRadio('hasAllergies'),
      allergies: getValue('allergies'),
      allergyReactions: getValue('allergyReactions'),
      guardianName: getValue('guardianName'),
      photoId: photoIdBase64,
      photoIdUrl: uploadedPhotoIdUrl,
      consent: getRadio('consent'),
      submissionDate: new Date().toLocaleString(),
      signature: signaturePad.toDataURL(),
      signatureUrl: uploadedSignatureUrl
    };
  }
  
  // ============================================
  // GENERATE PDF (abbreviated for file size)
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
    
    function addText(text, fontSize = 11, isBold = false) {
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', isBold ? 'bold' : 'normal');
      const safeText = String(text || '');
      const lines = doc.splitTextToSize(safeText, contentWidth);
      doc.text(lines, leftMargin, yPos);
      yPos += (lines.length * fontSize * 0.4) + 2;
      if (yPos > 270) { doc.addPage(); yPos = 20; }
    }
    
    function addLabelValue(label, value) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(label, leftMargin, yPos);
      doc.setFont('helvetica', 'normal');
      const labelWidth = doc.getTextWidth(label) + 2;
      const safeValue = String(value || 'N/A');
      const valueLines = doc.splitTextToSize(safeValue, contentWidth - labelWidth - 10);
      doc.text(valueLines, leftMargin + labelWidth, yPos);
      yPos += (valueLines.length * 5) + 3;
      if (yPos > 270) { doc.addPage(); yPos = 20; }
    }
    
    function addSectionHeader(text) {
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
    doc.text('Submitted: ' + formData.submissionDate, pageWidth / 2, yPos, { align: 'center' });
    doc.setTextColor(0);
    yPos += 5;
    doc.setLineWidth(1);
    doc.line(leftMargin, yPos, pageWidth - leftMargin, yPos);
    yPos += 10;
    
    // Personal Information
    addSectionHeader('PERSONAL INFORMATION');
    addLabelValue('Name: ', formData.firstName + ' ' + formData.lastName);
    addLabelValue('Gender: ', formData.gender);
    addLabelValue('Date of Birth: ', formData.dateOfBirth);
    addLabelValue('Email: ', formData.email);
    addLabelValue('Phone: ', formData.phone);
    // NEW FIELD
    addLabelValue('How Heard About Us: ', formData.howHeardAboutUs);
    
    // Address
    addSectionHeader('ADDRESS');
    addText(formData.streetAddress);
    addText(formData.city + ', ' + formData.state + ' ' + formData.postalCode);
    addText(formData.country);
    
    // Health Concerns
    addSectionHeader('HEALTH CONCERNS & SYMPTOMS');
    addLabelValue('What Brings You In: ', formData.whatBringsYou);
    addLabelValue('Currently Injured: ', formData.injured);
    if (formData.injured === 'Yes') {
      addLabelValue('Injury Description: ', formData.injuryDescription);
      addLabelValue('Injury Location: ', formData.injuryLocation);
      if (formData.injuryDate) addLabelValue('When It Occurred: ', formData.injuryDate);
    }
    
    // Medical History
    addSectionHeader('MEDICAL HISTORY');
    
    // NEW FIELDS - Primary Care Physician
    addLabelValue('Has Primary Care Physician: ', formData.hasPCP);
    if (formData.hasPCP === 'Yes') {
      addLabelValue('PCP Name: ', formData.pcpName);
      if (formData.pcpPractice) addLabelValue('PCP Practice: ', formData.pcpPractice);
      if (formData.pcpPhone) addLabelValue('PCP Phone: ', formData.pcpPhone);
    }
    
    // NEW FIELDS - Recent Hospitalization
    addLabelValue('Hospitalized in Past Year: ', formData.recentHospitalization);
    if (formData.recentHospitalization === 'Yes') {
      addLabelValue('Hospitalization Reason: ', formData.hospitalizationReason);
    }
    
    if (formData.medicalHistory) {
      const conditionOrder = ['hypertension', 'highCholesterol', 'heartDisease', 
                              'diabetes', 'thyroid', 'depression', 
                              'kidney', 'liver', 'autoimmune', 'cancer'];
      conditionOrder.forEach(key => {
        const condition = formData.medicalHistory[key];
        if (condition) {
          let conditionText = condition.response || 'Not answered';
          if (condition.response === 'Yes') {
            if (condition.type) conditionText += ` (Type: ${condition.type})`;
            if (condition.year) conditionText += ` (Diagnosed: ${condition.year})`;
          }
          addLabelValue(condition.label + ': ', conditionText);
        }
      });
    } else {
      addLabelValue('Conditions: ', formData.conditions || 'None');
    }
    
    // Medications
    addSectionHeader('MEDICATIONS & ALLERGIES');
    addLabelValue('On HRT: ', formData.onHRT || 'Not specified');
    if (formData.onHRT === 'Yes' && formData.hrtDetails) {
      addLabelValue('HRT Details: ', formData.hrtDetails);
    }
    addLabelValue('On Other Medications: ', formData.onMedications);
    if (formData.onMedications === 'Yes') {
      addLabelValue('Current Medications: ', formData.currentMedications);
    }
    addLabelValue('Has Allergies: ', formData.hasAllergies);
    if (formData.hasAllergies === 'Yes') {
      addLabelValue('Allergies: ', formData.allergies);
    }
    
    // Consent
    addSectionHeader('CONSENT & SIGNATURE');
    addLabelValue('Consent Given: ', formData.consent);
    
    return doc.output('blob');
  }
  
  // ============================================
  // SUBMIT TO DATABASE
  // ============================================
  
  async function submitToDatabase(formData) {
    try {
      const response = await fetch(CONFIG.apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Database submission failed');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Database submission error:', error);
      return null;
    }
  }
  
  // ============================================
  // SEND TO GOHIGHLEVEL
  // ============================================
  
  async function sendToGHL(formData, signatureUrl, pdfUrl) {
    console.log('📤 Sending to GoHighLevel...');
    console.log('Payload:', JSON.stringify({
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone
    }));
    
    const payload = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      dateOfBirth: formData.dateOfBirth,
      address: formData.streetAddress,
      city: formData.city,
      state: formData.state,
      zip: formData.postalCode,
      customFieldKey: CONFIG.ghl.customFieldKey,
      customFieldValue: 'Complete',
      tags: CONFIG.ghl.tags,
      signatureUrl: signatureUrl,
      pdfUrl: pdfUrl,
      photoIdUrl: formData.photoIdUrl,
      // Intake data for notes - using actual form fields
      intakeData: {
        // NEW FIELD
        howHeardAboutUs: formData.howHeardAboutUs || '',
        whatBringsYou: formData.whatBringsYou || '',
        injured: formData.injured || '',
        injuryDescription: formData.injuryDescription || '',
        conditions: formData.conditions || '',
        medicalHistory: formData.medicalHistory || null,
        // NEW FIELDS - Primary Care Physician
        hasPCP: formData.hasPCP || '',
        pcpName: formData.pcpName || '',
        pcpPractice: formData.pcpPractice || '',
        pcpPhone: formData.pcpPhone || '',
        // NEW FIELDS - Recent Hospitalization
        recentHospitalization: formData.recentHospitalization || '',
        hospitalizationReason: formData.hospitalizationReason || '',
        onHRT: formData.onHRT || '',
        hrtDetails: formData.hrtDetails || '',
        onMedications: formData.onMedications || '',
        currentMedications: formData.currentMedications || '',
        hasAllergies: formData.hasAllergies || '',
        allergies: formData.allergies || ''
      }
    };
    
    try {
      const response = await fetch(CONFIG.ghlEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const result = await response.json();
      console.log('GHL Response status:', response.status);
      console.log('GHL Response:', result);
      
      if (!response.ok) {
        console.error('❌ GHL error:', result);
        return false;
      } else {
        console.log('✅ GHL sync successful');
        return true;
      }
    } catch (error) {
      console.error('GHL sync error:', error);
      return false;
    }
  }
  
  // ============================================
  // SEND EMAIL
  // ============================================
  
  async function sendEmail(formData, pdfBlob) {
    window.emailjs.init(CONFIG.emailjs.publicKey);
    
    const base64PDF = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(',')[1]);
      reader.readAsDataURL(pdfBlob);
    });
    
    const messageBody = `
NEW PATIENT INTAKE FORM SUBMISSION
==================================
Name: ${formData.firstName} ${formData.lastName}
Email: ${formData.email}
Phone: ${formData.phone}
How They Heard About Us: ${formData.howHeardAboutUs}
Submitted: ${formData.submissionDate}
==================================
PDF intake form is attached to this email.
`;
    
    const templateParams = {
      to_email: CONFIG.recipientEmail,
      from_name: `${formData.firstName} ${formData.lastName}`,
      patient_name: `${formData.firstName} ${formData.lastName}`,
      patient_email: formData.email,
      patient_phone: formData.phone,
      submission_date: formData.submissionDate,
      message: messageBody,
      content: base64PDF,
      filename: `RangeMedical_Intake_${formData.lastName}_${formData.firstName}.pdf`
    };
    
    return await window.emailjs.send(
      CONFIG.emailjs.serviceId,
      CONFIG.emailjs.templateId,
      templateParams
    );
  }
  
  // ============================================
  // FORM SUBMISSION
  // ============================================
  
  function showStatus(message, type) {
    const statusEl = document.getElementById('statusMessage');
    statusEl.textContent = message;
    statusEl.className = 'status-message visible ' + type;
  }
  
  function showThankYouPage(formData) {
    const container = document.getElementById('intakeContainer');
    container.innerHTML = `
      <div class="thank-you-page">
        <div class="thank-you-icon">✓</div>
        <h1>Thank You, ${formData.firstName}!</h1>
        <p class="thank-you-subtitle">Your intake form has been successfully submitted.</p>
        <div class="thank-you-details">
          <p>We've received your information and our team will review it before your appointment.</p>
          <p>A confirmation has been sent to our office.</p>
        </div>
        <div class="thank-you-contact">
          <h3>Questions?</h3>
          <p>Contact us at <a href="mailto:info@range-medical.com">info@range-medical.com</a></p>
        </div>
        <div class="thank-you-footer">
          <p>RANGE MEDICAL</p>
        </div>
      </div>
    `;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  
  document.getElementById('intakeForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    if (!validateForm()) {
      showStatus('Please fill in all required fields correctly.', 'error');
      const firstError = document.querySelector('.field-error.visible');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Processing...';
    showStatus('Submitting your form...', 'loading');
    
    try {
      showStatus('Uploading signature...', 'loading');
      uploadedSignatureUrl = await uploadSignature();
      
      showStatus('Collecting form data...', 'loading');
      const formData = await collectFormData();
      
      showStatus('Generating PDF...', 'loading');
      const pdfBlob = await generatePDF(formData);
      
      showStatus('Uploading PDF...', 'loading');
      const pdfUrl = await uploadPDFToSupabase(pdfBlob, formData);
      
      showStatus('Saving to Range Medical system...', 'loading');
      const dbData = {...formData};
      delete dbData.photoId;
      delete dbData.signature;
      dbData.signatureUrl = uploadedSignatureUrl;
      dbData.pdfUrl = pdfUrl;
      await submitToDatabase(dbData);
      
      showStatus('Updating patient record...', 'loading');
      const ghlResult = await sendToGHL(formData, uploadedSignatureUrl, pdfUrl);
      if (!ghlResult) {
        console.warn('⚠️ GHL sync may have failed - check logs');
      }
      
      showStatus('Sending email notification...', 'loading');
      await sendEmail(formData, pdfBlob);
      
      showThankYouPage(formData);
      
    } catch (error) {
      console.error('Submission error:', error);
      showStatus('Error: ' + (error.message || 'Unknown error occurred'), 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Intake Form';
    }
  });
}
