import Head from 'next/head';
import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

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
          <form id="intakeForm" noValidate>

            {/* Personal Information */}
            <div className="section">
              <h2 className="section-title">Personal Information</h2>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName">Legal First Name <span className="required">*</span></label>
                  <input type="text" id="firstName" name="firstName" placeholder="As shown on government ID" required />
                  <span className="field-error" id="firstNameError">First name is required</span>
                </div>
                <div className="form-group">
                  <label htmlFor="lastName">Legal Last Name <span className="required">*</span></label>
                  <input type="text" id="lastName" name="lastName" placeholder="As shown on government ID" required />
                  <span className="field-error" id="lastNameError">Last name is required</span>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="preferredName">Preferred Name</label>
                  <input type="text" id="preferredName" name="preferredName" placeholder="What should we call you?" />
                </div>
                <div className="form-group">
                  <label htmlFor="dateOfBirth">Date of Birth <span className="required">*</span></label>
                  <input type="text" id="dateOfBirth" name="dateOfBirth" placeholder="MM/DD/YYYY" required />
                  <span className="field-error" id="dateOfBirthError">Date of birth is required</span>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="sex">Biological Sex <span className="required">*</span></label>
                  <select id="sex" name="sex" required>
                    <option value="">Select...</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                  <span className="field-error" id="sexError">Please select an option</span>
                </div>
                <div className="form-group">
                  <label htmlFor="phone">Phone Number <span className="required">*</span></label>
                  <input type="tel" id="phone" name="phone" placeholder="(555) 555-5555" required />
                  <span className="field-error" id="phoneError">Phone number is required</span>
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
                  <input type="text" id="country" name="country" value="United States" required />
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
            </div>

            {/* Health Concerns Section */}
            <div className="section">
              <h2 className="section-title">Health Concerns</h2>

              <div className="form-row">
                <div className="form-group full-width">
                  <label htmlFor="whatBringsYou">What Brings You In Today? <span className="required">*</span></label>
                  <textarea id="whatBringsYou" name="whatBringsYou" rows="4" placeholder="Please describe your health concerns, symptoms, or wellness goals..." required></textarea>
                  <span className="field-error" id="whatBringsYouError">This field is required</span>
                </div>
              </div>

              {/* Injury Assessment */}
              <div className="form-row">
                <div className="form-group full-width">
                  <label>Are you currently dealing with an injury? <span className="required">*</span></label>
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
                    <div className="form-row">
                      <div className="form-group full-width">
                        <label htmlFor="currentTreatment">Are you currently receiving treatment?</label>
                        <select id="currentTreatment" name="currentTreatment">
                          <option value="">Select...</option>
                          <option value="Yes - Physical Therapy">Yes - Physical Therapy</option>
                          <option value="Yes - Chiropractic">Yes - Chiropractic</option>
                          <option value="Yes - Range Sports Therapy">Yes - Range Sports Therapy</option>
                          <option value="Yes - Other">Yes - Other</option>
                          <option value="No">No</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Symptom Checklist - Energy & Optimization */}
              <div className="symptom-section">
                <h3 className="symptom-section-title">⚡ Energy & Optimization Symptoms</h3>
                <p className="symptom-section-subtitle">Check any symptoms you're currently experiencing. This helps us understand if you might benefit from hormone optimization or metabolic support.</p>

                <div className="symptom-grid">
                  {/* Brain Fog */}
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

                  {/* Fatigue */}
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

                  {/* Poor Sleep */}
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

                  {/* Weight Gain */}
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

                  {/* Low Libido */}
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

                  {/* Mood Changes */}
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

                  {/* Slow Recovery */}
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

                  {/* Muscle Loss */}
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

                  {/* Hair Thinning */}
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

                {/* Duration Question - Shows when any symptom is checked */}
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
            </div>

            {/* Primary Care Physician */}
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
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="pcpName">Physician Name <span className="required">*</span></label>
                        <input type="text" id="pcpName" name="pcpName" placeholder="Dr. Smith" />
                        <span className="field-error" id="pcpNameError">Physician name is required</span>
                      </div>
                      <div className="form-group">
                        <label htmlFor="pcpPractice">Practice/Clinic Name</label>
                        <input type="text" id="pcpPractice" name="pcpPractice" placeholder="Newport Medical Group" />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="pcpPhone">Physician Phone</label>
                        <input type="tel" id="pcpPhone" name="pcpPhone" placeholder="(555) 555-5555" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Hospitalizations */}
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
                    <div className="form-group">
                      <label htmlFor="heartDisease-year">Year Diagnosed</label>
                      <input type="text" id="heartDisease-year" name="heartDiseaseYear" placeholder="e.g., 2020" />
                    </div>
                  </div>
                </div>

                <div className="condition-item">
                  <label><strong>Blood Clots / DVT</strong> <span className="required">*</span></label>
                  <div className="radio-group" style={{marginBottom: '0.5rem'}}>
                    <div className="radio-item">
                      <input type="radio" id="bloodClots_yes" name="bloodClots" value="Yes" required className="condition-radio" />
                      <label htmlFor="bloodClots_yes">Yes</label>
                    </div>
                    <div className="radio-item">
                      <input type="radio" id="bloodClots_no" name="bloodClots" value="No" className="condition-radio" />
                      <label htmlFor="bloodClots_no">No</label>
                    </div>
                  </div>
                  <div className="condition-details" id="bloodClots-details">
                    <div className="form-group">
                      <label htmlFor="bloodClots-year">Year Diagnosed</label>
                      <input type="text" id="bloodClots-year" name="bloodClotsYear" placeholder="e.g., 2020" />
                    </div>
                  </div>
                </div>

                <div className="condition-item">
                  <label><strong>Stroke</strong> <span className="required">*</span></label>
                  <div className="radio-group">
                    <div className="radio-item">
                      <input type="radio" id="stroke_yes" name="stroke" value="Yes" required className="condition-radio" />
                      <label htmlFor="stroke_yes">Yes</label>
                    </div>
                    <div className="radio-item">
                      <input type="radio" id="stroke_no" name="stroke" value="No" className="condition-radio" />
                      <label htmlFor="stroke_no">No</label>
                    </div>
                  </div>
                  <div className="condition-details" id="stroke-details">
                    <div className="form-group">
                      <label htmlFor="stroke-year">Year Diagnosed</label>
                      <input type="text" id="stroke-year" name="strokeYear" placeholder="e.g., 2020" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Metabolic */}
              <div className="condition-category" style={{backgroundColor: '#fef3c7', borderLeft: '4px solid #d97706'}}>
                <h3 style={{color: '#92400e'}}>🔥 Metabolic</h3>

                <div className="condition-item">
                  <label><strong>Diabetes (Type 1 or 2)</strong> <span className="required">*</span></label>
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
                    <div className="form-group">
                      <label htmlFor="diabetes-type">Type</label>
                      <select id="diabetes-type" name="diabetesType">
                        <option value="">Select...</option>
                        <option value="Type 1">Type 1</option>
                        <option value="Type 2">Type 2</option>
                        <option value="Pre-diabetes">Pre-diabetes</option>
                      </select>
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
                    <div className="form-group">
                      <label htmlFor="thyroid-type">Type</label>
                      <select id="thyroid-type" name="thyroidType">
                        <option value="">Select...</option>
                        <option value="Hypothyroid">Hypothyroid (underactive)</option>
                        <option value="Hyperthyroid">Hyperthyroid (overactive)</option>
                        <option value="Hashimoto's">Hashimoto's</option>
                        <option value="Graves' Disease">Graves' Disease</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="condition-item">
                  <label><strong>Liver Disease</strong> <span className="required">*</span></label>
                  <div className="radio-group">
                    <div className="radio-item">
                      <input type="radio" id="liverDisease_yes" name="liverDisease" value="Yes" required className="condition-radio" />
                      <label htmlFor="liverDisease_yes">Yes</label>
                    </div>
                    <div className="radio-item">
                      <input type="radio" id="liverDisease_no" name="liverDisease" value="No" className="condition-radio" />
                      <label htmlFor="liverDisease_no">No</label>
                    </div>
                  </div>
                  <div className="condition-details" id="liverDisease-details">
                    <div className="form-group">
                      <label htmlFor="liverDisease-year">Year Diagnosed</label>
                      <input type="text" id="liverDisease-year" name="liverDiseaseYear" placeholder="e.g., 2020" />
                    </div>
                  </div>
                </div>

                <div className="condition-item">
                  <label><strong>Kidney Disease</strong> <span className="required">*</span></label>
                  <div className="radio-group">
                    <div className="radio-item">
                      <input type="radio" id="kidneyDisease_yes" name="kidneyDisease" value="Yes" required className="condition-radio" />
                      <label htmlFor="kidneyDisease_yes">Yes</label>
                    </div>
                    <div className="radio-item">
                      <input type="radio" id="kidneyDisease_no" name="kidneyDisease" value="No" className="condition-radio" />
                      <label htmlFor="kidneyDisease_no">No</label>
                    </div>
                  </div>
                  <div className="condition-details" id="kidneyDisease-details">
                    <div className="form-group">
                      <label htmlFor="kidneyDisease-year">Year Diagnosed</label>
                      <input type="text" id="kidneyDisease-year" name="kidneyDiseaseYear" placeholder="e.g., 2020" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Cancer */}
              <div className="condition-category" style={{backgroundColor: '#fce7f3', borderLeft: '4px solid #db2777'}}>
                <h3 style={{color: '#9d174d'}}>🎗️ Cancer History</h3>

                <div className="condition-item">
                  <label><strong>Have you ever been diagnosed with cancer?</strong> <span className="required">*</span></label>
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
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="cancer-type">Type of Cancer</label>
                        <input type="text" id="cancer-type" name="cancerType" placeholder="e.g., Breast, Prostate" />
                      </div>
                      <div className="form-group">
                        <label htmlFor="cancer-year">Year Diagnosed</label>
                        <input type="text" id="cancer-year" name="cancerYear" placeholder="e.g., 2020" />
                      </div>
                    </div>
                    <div className="form-group">
                      <label htmlFor="cancer-status">Current Status</label>
                      <select id="cancer-status" name="cancerStatus">
                        <option value="">Select...</option>
                        <option value="In remission">In remission</option>
                        <option value="Currently in treatment">Currently in treatment</option>
                        <option value="Monitoring">Monitoring</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Other Conditions */}
              <div className="condition-category" style={{backgroundColor: '#f0fdf4', borderLeft: '4px solid #16a34a'}}>
                <h3 style={{color: '#166534'}}>📋 Other Conditions</h3>

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
                    <div className="form-group">
                      <label htmlFor="autoimmune-type">Which condition?</label>
                      <input type="text" id="autoimmune-type" name="autoimmuneType" placeholder="e.g., Rheumatoid Arthritis, Lupus" />
                    </div>
                  </div>
                </div>

                <div className="condition-item">
                  <label><strong>Mental Health Conditions</strong> <span className="required">*</span></label>
                  <div className="radio-group" style={{marginBottom: '0.5rem'}}>
                    <div className="radio-item">
                      <input type="radio" id="mentalHealth_yes" name="mentalHealth" value="Yes" required className="condition-radio" />
                      <label htmlFor="mentalHealth_yes">Yes</label>
                    </div>
                    <div className="radio-item">
                      <input type="radio" id="mentalHealth_no" name="mentalHealth" value="No" className="condition-radio" />
                      <label htmlFor="mentalHealth_no">No</label>
                    </div>
                  </div>
                  <div className="condition-details" id="mentalHealth-details">
                    <div className="form-group">
                      <label htmlFor="mentalHealth-type">Which condition(s)?</label>
                      <input type="text" id="mentalHealth-type" name="mentalHealthType" placeholder="e.g., Anxiety, Depression, ADHD" />
                    </div>
                  </div>
                </div>

                <div className="condition-item">
                  <label><strong>Sleep Apnea</strong> <span className="required">*</span></label>
                  <div className="radio-group">
                    <div className="radio-item">
                      <input type="radio" id="sleepApnea_yes" name="sleepApnea" value="Yes" required className="condition-radio" />
                      <label htmlFor="sleepApnea_yes">Yes</label>
                    </div>
                    <div className="radio-item">
                      <input type="radio" id="sleepApnea_no" name="sleepApnea" value="No" className="condition-radio" />
                      <label htmlFor="sleepApnea_no">No</label>
                    </div>
                  </div>
                  <div className="condition-details" id="sleepApnea-details">
                    <div className="form-group">
                      <label htmlFor="sleepApnea-cpap">Do you use a CPAP?</label>
                      <select id="sleepApnea-cpap" name="sleepApneaCPAP">
                        <option value="">Select...</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                        <option value="Sometimes">Sometimes</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Medications & Allergies */}
            <div className="section">
              <h2 className="section-title">Medications & Allergies</h2>

              <div className="form-row">
                <div className="form-group full-width">
                  <label htmlFor="currentMedications">Current Medications</label>
                  <textarea id="currentMedications" name="currentMedications" rows="3" placeholder="List all medications including supplements, vitamins, and over-the-counter medications..."></textarea>
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

            {/* Lifestyle */}
            <div className="section">
              <h2 className="section-title">Lifestyle</h2>

              <div className="form-row">
                <div className="form-group">
                  <label>Do you smoke or use tobacco? <span className="required">*</span></label>
                  <div className="radio-group">
                    <div className="radio-item">
                      <input type="radio" id="smokerYes" name="smoker" value="Yes" required />
                      <label htmlFor="smokerYes">Yes</label>
                    </div>
                    <div className="radio-item">
                      <input type="radio" id="smokerNo" name="smoker" value="No" />
                      <label htmlFor="smokerNo">No</label>
                    </div>
                    <div className="radio-item">
                      <input type="radio" id="smokerFormer" name="smoker" value="Former" />
                      <label htmlFor="smokerFormer">Former</label>
                    </div>
                  </div>
                  <span className="field-error" id="smokerError">Please select an option</span>
                </div>

                <div className="form-group">
                  <label>Do you drink alcohol? <span className="required">*</span></label>
                  <div className="radio-group">
                    <div className="radio-item">
                      <input type="radio" id="alcoholYes" name="alcohol" value="Yes" required />
                      <label htmlFor="alcoholYes">Yes</label>
                    </div>
                    <div className="radio-item">
                      <input type="radio" id="alcoholNo" name="alcohol" value="No" />
                      <label htmlFor="alcoholNo">No</label>
                    </div>
                    <div className="radio-item">
                      <input type="radio" id="alcoholOccasional" name="alcohol" value="Occasionally" />
                      <label htmlFor="alcoholOccasional">Occasionally</label>
                    </div>
                  </div>
                  <span className="field-error" id="alcoholError">Please select an option</span>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group full-width">
                  <label htmlFor="exerciseFrequency">How often do you exercise?</label>
                  <select id="exerciseFrequency" name="exerciseFrequency">
                    <option value="">Select...</option>
                    <option value="Daily">Daily</option>
                    <option value="4-6 times per week">4-6 times per week</option>
                    <option value="2-3 times per week">2-3 times per week</option>
                    <option value="Once a week">Once a week</option>
                    <option value="Rarely">Rarely</option>
                    <option value="Never">Never</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Signature & Consent */}
            <div className="section">
              <h2 className="section-title">Signature & Consent</h2>

              <div style={{backgroundColor: 'var(--gray-50)', padding: '1rem', borderRadius: '4px', marginBottom: '1.5rem', fontSize: '0.875rem', color: 'var(--gray-700)'}}>
                <p style={{marginBottom: '0.5rem'}}><strong>By signing below, I certify that:</strong></p>
                <ul style={{marginLeft: '1.5rem', marginBottom: '0'}}>
                  <li>The information I have provided is true and complete to the best of my knowledge.</li>
                  <li>I will inform Range Medical of any changes to my health status.</li>
                  <li>I authorize Range Medical to use this information to provide my care.</li>
                </ul>
              </div>

              <div className="form-group">
                <label>Patient Signature <span className="required">*</span></label>
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

  // Resize canvas
  function resizeCanvas() {
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    canvas.getContext('2d').scale(ratio, ratio);
    signaturePad.clear();
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // Clear signature button
  document.getElementById('clearSignature').addEventListener('click', () => {
    signaturePad.clear();
  });

  // Initialize input masks
  if (typeof IMask !== 'undefined') {
    IMask(document.getElementById('phone'), { mask: '(000) 000-0000' });
    IMask(document.getElementById('dateOfBirth'), { mask: '00/00/0000' });
    const pcpPhone = document.getElementById('pcpPhone');
    if (pcpPhone) IMask(pcpPhone, { mask: '(000) 000-0000' });
  }

  // How heard about us - Other field
  const howHeardSelect = document.getElementById('howHeardAboutUs');
  const howHeardOtherField = document.getElementById('howHeardOtherField');
  howHeardSelect.addEventListener('change', () => {
    if (howHeardSelect.value === 'Other') {
      howHeardOtherField.classList.add('visible');
    } else {
      howHeardOtherField.classList.remove('visible');
    }
  });

  // Injury conditional fields
  const injuredRadios = document.querySelectorAll('input[name="injured"]');
  const injuryFields = document.getElementById('injuryFields');
  injuredRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      if (radio.value === 'Yes' && radio.checked) {
        injuryFields.classList.add('visible');
      } else if (radio.value === 'No' && radio.checked) {
        injuryFields.classList.remove('visible');
      }
    });
  });

  // Symptom checkboxes - show follow-up questions
  const symptomCheckboxes = document.querySelectorAll('input[id^="symptom_"]');
  const symptomDuration = document.getElementById('symptomDuration');

  symptomCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', () => {
      // Get the symptom name from the checkbox ID
      const symptomName = checkbox.id.replace('symptom_', '');
      const symptomItem = document.getElementById('symptom' + symptomName.charAt(0).toUpperCase() + symptomName.slice(1));
      const followup = document.getElementById('followup_' + symptomName);

      if (checkbox.checked) {
        if (symptomItem) symptomItem.classList.add('selected');
        if (followup) followup.classList.add('visible');
      } else {
        if (symptomItem) symptomItem.classList.remove('selected');
        if (followup) followup.classList.remove('visible');
      }

      // Show/hide duration question based on any checkbox being checked
      const anyChecked = Array.from(symptomCheckboxes).some(cb => cb.checked);
      if (anyChecked) {
        symptomDuration.classList.add('visible');
      } else {
        symptomDuration.classList.remove('visible');
      }
    });
  });

  // PCP conditional fields
  const pcpRadios = document.querySelectorAll('input[name="hasPCP"]');
  const pcpFields = document.getElementById('pcpFields');
  pcpRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      if (radio.value === 'Yes' && radio.checked) {
        pcpFields.classList.add('visible');
      } else if (radio.value === 'No' && radio.checked) {
        pcpFields.classList.remove('visible');
      }
    });
  });

  // Hospitalization conditional fields
  const hospitalRadios = document.querySelectorAll('input[name="recentHospitalization"]');
  const hospitalizationFields = document.getElementById('hospitalizationFields');
  hospitalRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      if (radio.value === 'Yes' && radio.checked) {
        hospitalizationFields.classList.add('visible');
      } else if (radio.value === 'No' && radio.checked) {
        hospitalizationFields.classList.remove('visible');
      }
    });
  });

  // Allergies conditional fields
  const allergiesRadios = document.querySelectorAll('input[name="hasAllergies"]');
  const allergiesFields = document.getElementById('allergiesFields');
  allergiesRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      if (radio.value === 'Yes' && radio.checked) {
        allergiesFields.classList.add('visible');
      } else if (radio.value === 'No' && radio.checked) {
        allergiesFields.classList.remove('visible');
      }
    });
  });

  // Medical condition radios - show details on Yes
  const conditionRadios = document.querySelectorAll('.condition-radio');
  conditionRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      const conditionName = radio.name;
      const detailsEl = document.getElementById(conditionName + '-details');
      if (detailsEl) {
        if (radio.value === 'Yes' && radio.checked) {
          detailsEl.classList.add('visible');
        } else if (radio.value === 'No' && radio.checked) {
          detailsEl.classList.remove('visible');
        }
      }
    });
  });

  // Form submission
  const form = document.getElementById('intakeForm');
  const submitBtn = document.getElementById('submitBtn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Clear previous errors
    document.querySelectorAll('.field-error').forEach(el => el.classList.remove('visible'));
    document.querySelectorAll('input.error, select.error, textarea.error').forEach(el => el.classList.remove('error'));

    let hasErrors = false;

    // Validation helper
    const validateField = (id, errorId) => {
      const field = document.getElementById(id);
      const error = document.getElementById(errorId);
      if (!field.value.trim()) {
        field.classList.add('error');
        if (error) error.classList.add('visible');
        hasErrors = true;
      }
    };

    const validateRadio = (name, errorId) => {
      const radios = document.querySelectorAll(`input[name="${name}"]`);
      const checked = Array.from(radios).some(r => r.checked);
      if (!checked) {
        const error = document.getElementById(errorId);
        if (error) error.classList.add('visible');
        hasErrors = true;
      }
    };

    // Required field validations
    validateField('firstName', 'firstNameError');
    validateField('lastName', 'lastNameError');
    validateField('dateOfBirth', 'dateOfBirthError');
    validateField('sex', 'sexError');
    validateField('phone', 'phoneError');
    validateField('email', 'emailError');
    validateField('streetAddress', 'streetAddressError');
    validateField('city', 'cityError');
    validateField('state', 'stateError');
    validateField('postalCode', 'postalCodeError');
    validateField('country', 'countryError');
    validateField('howHeardAboutUs', 'howHeardAboutUsError');
    validateField('whatBringsYou', 'whatBringsYouError');

    validateRadio('injured', 'injuredError');
    validateRadio('hasPCP', 'hasPCPError');
    validateRadio('recentHospitalization', 'recentHospitalizationError');
    validateRadio('hasAllergies', 'hasAllergiesError');
    validateRadio('smoker', 'smokerError');
    validateRadio('alcohol', 'alcoholError');

    // Medical history validations
    validateRadio('hypertension', null);
    validateRadio('highCholesterol', null);
    validateRadio('heartDisease', null);
    validateRadio('bloodClots', null);
    validateRadio('stroke', null);
    validateRadio('diabetes', null);
    validateRadio('thyroid', null);
    validateRadio('liverDisease', null);
    validateRadio('kidneyDisease', null);
    validateRadio('cancer', null);
    validateRadio('autoimmune', null);
    validateRadio('mentalHealth', null);
    validateRadio('sleepApnea', null);

    // Conditional validations
    const injured = document.querySelector('input[name="injured"]:checked');
    if (injured && injured.value === 'Yes') {
      validateField('injuryDescription', 'injuryDescriptionError');
      validateField('injuryLocation', 'injuryLocationError');
    }

    const hasPCP = document.querySelector('input[name="hasPCP"]:checked');
    if (hasPCP && hasPCP.value === 'Yes') {
      validateField('pcpName', 'pcpNameError');
    }

    const recentHospital = document.querySelector('input[name="recentHospitalization"]:checked');
    if (recentHospital && recentHospital.value === 'Yes') {
      validateField('hospitalizationReason', 'hospitalizationReasonError');
    }

    const hasAllergies = document.querySelector('input[name="hasAllergies"]:checked');
    if (hasAllergies && hasAllergies.value === 'Yes') {
      validateField('allergiesList', 'allergiesListError');
    }

    // Signature validation
    if (signaturePad.isEmpty()) {
      document.getElementById('signatureError').classList.add('visible');
      hasErrors = true;
    }

    if (hasErrors) {
      // Scroll to first error
      const firstError = document.querySelector('.field-error.visible');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // Disable submit button
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    // Collect form data
    const getValue = (id) => {
      const el = document.getElementById(id);
      return el ? el.value : '';
    };

    const getRadioValue = (name) => {
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
        // Get the follow-up value if it exists
        const followupSelects = document.querySelectorAll(`#followup_${symptomName} select, #followup_${symptomName} input`);
        followupSelects.forEach(sel => {
          if (sel.value) {
            symptomFollowups[symptomName] = sel.value;
          }
        });
      }
    });

    const formData = {
      // Personal Info
      firstName: getValue('firstName'),
      lastName: getValue('lastName'),
      preferredName: getValue('preferredName'),
      dateOfBirth: getValue('dateOfBirth'),
      sex: getValue('sex'),
      phone: getValue('phone'),
      email: getValue('email'),
      streetAddress: getValue('streetAddress'),
      city: getValue('city'),
      state: getValue('state'),
      postalCode: getValue('postalCode'),
      country: getValue('country'),
      howHeardAboutUs: getValue('howHeardAboutUs') === 'Other' 
        ? `Other: ${getValue('howHeardOther')}` 
        : getValue('howHeardAboutUs'),

      // Health Concerns
      whatBringsYou: getValue('whatBringsYou'),
      injured: getRadioValue('injured'),
      injuryDescription: getValue('injuryDescription'),
      injuryLocation: getValue('injuryLocation'),
      injuryDate: getValue('injuryDate'),
      currentTreatment: getValue('currentTreatment'),

      // Symptoms (Energy & Optimization)
      symptoms: symptoms,
      symptomFollowups: symptomFollowups,
      symptomDuration: getRadioValue('symptomDuration'),

      // Healthcare Providers
      hasPCP: getRadioValue('hasPCP'),
      pcpName: getValue('pcpName'),
      pcpPractice: getValue('pcpPractice'),
      pcpPhone: getValue('pcpPhone'),
      recentHospitalization: getRadioValue('recentHospitalization'),
      hospitalizationReason: getValue('hospitalizationReason'),

      // Medical History
      hypertension: getRadioValue('hypertension'),
      hypertensionYear: getValue('hypertension-year'),
      highCholesterol: getRadioValue('highCholesterol'),
      highCholesterolYear: getValue('highCholesterol-year'),
      heartDisease: getRadioValue('heartDisease'),
      heartDiseaseYear: getValue('heartDisease-year'),
      bloodClots: getRadioValue('bloodClots'),
      bloodClotsYear: getValue('bloodClots-year'),
      stroke: getRadioValue('stroke'),
      strokeYear: getValue('stroke-year'),
      diabetes: getRadioValue('diabetes'),
      diabetesType: getValue('diabetes-type'),
      thyroid: getRadioValue('thyroid'),
      thyroidType: getValue('thyroid-type'),
      liverDisease: getRadioValue('liverDisease'),
      liverDiseaseYear: getValue('liverDisease-year'),
      kidneyDisease: getRadioValue('kidneyDisease'),
      kidneyDiseaseYear: getValue('kidneyDisease-year'),
      cancer: getRadioValue('cancer'),
      cancerType: getValue('cancer-type'),
      cancerYear: getValue('cancer-year'),
      cancerStatus: getValue('cancer-status'),
      autoimmune: getRadioValue('autoimmune'),
      autoimmuneType: getValue('autoimmune-type'),
      mentalHealth: getRadioValue('mentalHealth'),
      mentalHealthType: getValue('mentalHealth-type'),
      sleepApnea: getRadioValue('sleepApnea'),
      sleepApneaCPAP: getValue('sleepApnea-cpap'),

      // Medications & Allergies
      currentMedications: getValue('currentMedications'),
      hasAllergies: getRadioValue('hasAllergies'),
      allergiesList: getValue('allergiesList'),

      // Lifestyle
      smoker: getRadioValue('smoker'),
      alcohol: getRadioValue('alcohol'),
      exerciseFrequency: getValue('exerciseFrequency'),

      // Signature
      signatureDate: getValue('signatureDate'),
      signatureData: signaturePad.toDataURL(),

      // Metadata
      submittedAt: new Date().toISOString()
    };

    try {
      // Submit to API
      const response = await fetch('/api/intakes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to submit form');
      }

      // Also sync to GHL
      await fetch('/api/intake-to-ghl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      // Show thank you screen
      document.getElementById('intakeContainer').querySelector('.form-container').style.display = 'none';
      document.getElementById('intakeContainer').querySelector('.intake-header').style.display = 'none';
      document.getElementById('thankYouContainer').classList.add('visible');

      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (error) {
      console.error('Submission error:', error);
      alert('There was an error submitting your form. Please try again or call us at (949) 997-3988.');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Medical Intake Form';
    }
  });
}
