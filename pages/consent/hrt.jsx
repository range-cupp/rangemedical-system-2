import Head from 'next/head';
import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

export default function HRTConsent() {
  const [scriptsLoaded, setScriptsLoaded] = useState(0);
  const formInitialized = useRef(false);

  useEffect(() => {
    if (scriptsLoaded >= 3 && !formInitialized.current) {
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
        <title>Hormone Replacement Therapy Consent | Range Medical</title>
        <meta name="description" content="HRT consent form for Range Medical hormone replacement therapy services." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex, nofollow" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <Script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js" onLoad={handleScriptLoad} />

      <Script src="https://cdn.jsdelivr.net/npm/signature_pad@4.1.7/dist/signature_pad.umd.min.js" onLoad={handleScriptLoad} />
      <Script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2" onLoad={handleScriptLoad} />

      <style jsx global>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; background: #f9f9f9; color: #111; }
        .consent-container { max-width: 720px; margin: 0 auto; background: #fff; min-height: 100vh; }
        .consent-header { background: #000; color: #fff; padding: 24px 28px; }
        .clinic-name { font-size: 22px; font-weight: 700; letter-spacing: 2px; margin-bottom: 4px; color: #fff; }
        .form-title { font-size: 14px; font-weight: 400; opacity: 0.85; color: #fff; text-transform: none; letter-spacing: normal; margin-top: 0; }
        .consent-header p { font-size: 13px; opacity: 0.7; color: #fff; margin-top: 4px; }
        .form-container { background: #fff; border: none; padding: 0 28px 40px; }
        .section { border-bottom: 1px solid #e5e5e5; padding: 28px 0; margin-bottom: 0; }
        .section:last-of-type { border-bottom: none; padding-bottom: 0; }
        .section-title { font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid #000; display: block; }
        .form-row { display: flex; gap: 16px; margin-bottom: 16px; }
        .form-row:last-child { margin-bottom: 0; }
        .form-group { flex: 1; display: flex; flex-direction: column; }
        .form-group.full-width { grid-column: 1 / -1; }
        .consent-container label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 4px; color: #333; text-transform: none; letter-spacing: normal; }
        .consent-container label .required { color: #dc2626; margin-left: 2px; }
        .consent-container input[type="text"],.consent-container input[type="email"],.consent-container input[type="tel"],.consent-container input[type="date"],.consent-container select,.consent-container textarea { width: 100%; padding: 10px 12px; font-size: 14px; font-family: inherit; border: 1px solid #ccc; background: #fff; color: #111; border-radius: 0; transition: border-color 0.2s ease; }
        .consent-container input:focus,.consent-container select:focus,.consent-container textarea:focus { outline: none; border-color: #000; box-shadow: 0 0 0 2px rgba(0,0,0,0.1); }
        .consent-container input.error,.consent-container select.error,.consent-container textarea.error { border-color: #dc2626; }
        .consent-text { background: #fafafa; border: 1px solid #e5e5e5; border-radius: 0; padding: 20px; margin-bottom: 16px; line-height: 1.6; }
        .consent-text h4 { font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px; color: #262626; }
        .consent-text p { margin-bottom: 12px; color: #333; font-size: 14px; line-height: 1.6; }
        .consent-text p:last-child { margin-bottom: 0; }
        .consent-text ol { margin-left: 1.5rem; margin-bottom: 12px; }
        .consent-text li { margin-bottom: 12px; color: #333; font-size: 14px; line-height: 1.6; padding-left: 0.25rem; }
        .consent-text li:last-child { margin-bottom: 0; }
        .consent-text strong { font-weight: 600; }
        .checkbox-consent { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 16px; padding: 14px 16px; background: #fafafa; border: 1px solid #e5e5e5; border-radius: 0; }
        .checkbox-consent input[type="checkbox"] { width: 18px; height: 18px; margin-top: 3px; cursor: pointer; accent-color: #000; flex-shrink: 0; }
        .checkbox-consent label { font-size: 13px; font-weight: 500; text-transform: none; letter-spacing: normal; margin-bottom: 0; cursor: pointer; color: #333; line-height: 1.55; }
        .checkbox-consent.error { border-color: #dc2626; background: #fef2f2; }
        .health-question { background: #fafafa; border: 1px solid #e5e5e5; border-radius: 0; padding: 16px; margin-bottom: 12px; }
        .health-question.warning { background: #fff7ed; border-color: #f59e0b; }
        .health-question-text { font-size: 14px; font-weight: 600; margin-bottom: 6px; color: #111; line-height: 1.5; }
        .health-question-note { font-size: 12px; color: #666; font-style: italic; margin-bottom: 8px; }
        .radio-group { display: flex; gap: 20px; }
        .radio-item { display: flex; align-items: center; gap: 6px; cursor: pointer; }
        .radio-item input[type="radio"] { width: 1.25rem; height: 1.25rem; cursor: pointer; accent-color: #000; }
        .radio-item label { font-size: 14px; font-weight: 500; text-transform: none; letter-spacing: normal; margin-bottom: 0; cursor: pointer; color: #333; }
        .warning-alert { background: #fef3c7; border: 2px solid #f59e0b; border-radius: 0; padding: 16px; margin-bottom: 16px; display: none; }
        .warning-alert.visible { display: block; }
        .warning-alert h4 { font-size: 14px; font-weight: 700; color: #92400e; margin-bottom: 4px; }
        .warning-alert p { font-size: 13px; color: #78350f; line-height: 1.5; }
        .health-question.has-error { border-color: #dc2626; background: #fef2f2; }
        .health-detail { margin-top: 8px; display: none; }
        .health-detail textarea { width: 100%; padding: 8px 10px; font-size: 13px; font-family: inherit; border: 1px solid #ccc; background: #fff; min-height: 60px; resize: vertical; border-radius: 0; }
        .ack-item { border: 1px solid #e5e7eb; border-radius: 0; padding: 14px 16px; margin-bottom: 10px; transition: border-color 0.2s; }
        .ack-item label { display: flex; gap: 12px; cursor: pointer; align-items: flex-start; }
        .ack-checkbox { position: absolute; opacity: 0; width: 0; height: 0; }
        .ack-initials { width: 28px; height: 28px; min-width: 28px; border: 2px solid #d4d4d4; border-radius: 0; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; color: transparent; background: #fff; cursor: pointer; transition: all 0.15s; margin-top: 1px; user-select: none; }
        .ack-checkbox:checked + .ack-initials { background: #000; border-color: #000; color: #fff; }
        .ack-text { font-size: 13px; line-height: 1.55; color: #333; }
        .signature-wrapper { margin-bottom: 16px; }
        .signature-label { font-size: 13px; font-weight: 600; margin-bottom: 8px; color: #333; display: block; text-transform: none; letter-spacing: normal; }
        .signature-pad-container { border: 2px solid #000; border-radius: 0; background: #fff; position: relative; margin-bottom: 8px; overflow: hidden; }
        .signature-pad-container.error { border-color: #dc2626; }
        #signaturePad { display: block; width: 100%; height: 150px; cursor: crosshair; touch-action: none; }
        .signature-placeholder { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); color: #a3a3a3; font-size: 14px; pointer-events: none; text-align: center; }
        .signature-controls { text-align: right; }
        .btn-clear { background: none; border: 1px solid #ccc; padding: 6px 14px; border-radius: 0; cursor: pointer; font-size: 13px; font-family: inherit; }
        .btn-clear:hover { background: #f5f5f5; }
        .field-error { font-size: 12px; color: #dc2626; margin-top: 4px; display: none; }
        .field-error.visible { display: block; }
        .submit-section { padding-top: 20px; text-align: center; }
        .btn-submit { background: #000; color: #fff; border: none; padding: 14px 48px; font-size: 16px; font-weight: 600; border-radius: 0; cursor: pointer; letter-spacing: 0.5px; font-family: inherit; min-width: 250px; }
        .btn-submit:hover:not(:disabled) { background: #222; }
        .btn-submit:disabled { background: #999; cursor: not-allowed; }
        .validation-summary { background: #fef2f2; border: 1px solid #fecaca; border-radius: 0; padding: 1rem 1.5rem; margin-bottom: 1rem; display: none; }
        .validation-summary.visible { display: block; }
        .validation-summary h3 { color: #991b1b; font-size: 0.9375rem; margin-bottom: 0.5rem; }
        .validation-summary ul { margin: 0; padding-left: 1.25rem; color: #dc2626; font-size: 0.875rem; }
        .validation-summary ul li { margin-bottom: 0.25rem; }
        .status-message { margin-top: 16px; padding: 12px; border-radius: 0; font-size: 14px; text-align: center; display: none; }
        .status-message.visible { display: block; }
        .status-message.error { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
        .status-message.success { background: #f0fdf4; color: #15803d; border: 1px solid #86efac; }
        .status-message.loading { background: #f5f5f5; color: #404040; border: 1px solid #d4d4d4; }
        .consent-footer { text-align: center; padding: 20px; border-top: 1px solid #e5e5e5; font-size: 12px; color: #999; }
        .consent-footer p { margin-bottom: 4px; }
        .thank-you-page { background: #fff; border: 2px solid #000; padding: 3rem 2rem; text-align: center; max-width: 720px; margin: 40px auto; }
        .thank-you-icon { width: 80px; height: 80px; background: #000; color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 3rem; margin: 0 auto 2rem; }
        .thank-you-page h1 { font-size: 2rem; font-weight: 700; margin-bottom: 1rem; color: #000; }
        .thank-you-subtitle { font-size: 1.125rem; color: #525252; margin-bottom: 2rem; }
        .thank-you-details { padding: 2rem; background: #fafafa; border: 1.5px solid #e5e5e5; margin-bottom: 2rem; }
        .thank-you-details p { margin-bottom: 0.75rem; color: #404040; }
        .thank-you-details p:last-child { margin-bottom: 0; }
        .thank-you-contact { margin-bottom: 2rem; }
        .thank-you-contact h3 { font-size: 1rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem; color: #262626; }
        .thank-you-contact a { color: #000; text-decoration: underline; }
        .thank-you-footer { padding-top: 2rem; border-top: 2px solid #e5e5e5; }
        .thank-you-footer p { font-size: 1.5rem; font-weight: 700; letter-spacing: 0.15em; color: #000; }
        @media (max-width: 640px) { .consent-header { padding: 20px 16px; } .form-container { padding: 0 16px 30px; } .form-row { flex-direction: column; gap: 12px; } .radio-group { flex-direction: column; gap: 10px; } }
      `}</style>

      <div className="consent-container" id="consentContainer">
        <div className="consent-header">
          <h1 className="clinic-name">RANGE MEDICAL</h1>
          <p className="form-title">Hormone Replacement Therapy — Informed Consent</p>
        </div>
        
        <div className="form-container">
          <div id="statusMessage" className="status-message"></div>
          
          <form id="consentForm">
            {/* Patient Information */}
            <div className="section">
              <h3 className="section-title">Patient Information</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName">First Name <span className="required">*</span></label>
                  <input type="text" id="firstName" name="firstName" autoComplete="given-name" required />
                  <div className="field-error" id="firstNameError">Please enter your first name</div>
                </div>
                <div className="form-group">
                  <label htmlFor="lastName">Last Name <span className="required">*</span></label>
                  <input type="text" id="lastName" name="lastName" autoComplete="family-name" required />
                  <div className="field-error" id="lastNameError">Please enter your last name</div>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="email">Email <span className="required">*</span></label>
                  <input type="email" id="email" name="email" autoComplete="email" required />
                  <div className="field-error" id="emailError">Please enter a valid email</div>
                </div>
                <div className="form-group">
                  <label htmlFor="phone">Phone <span className="required">*</span></label>
                  <input type="tel" id="phone" name="phone" autoComplete="tel" required />
                  <p style={{ fontSize: '0.6rem', color: '#a3a3a3', lineHeight: 1.4, marginTop: '0.25rem' }}>By providing your phone number, you consent to receive text messages from Range Medical regarding your care, appointments, and health information. Message and data rates may apply. Up to 10 msg/mo. Reply STOP to opt out. <a href="/terms-of-use" target="_blank" rel="noopener noreferrer" style={{ color: '#a3a3a3', textDecoration: 'underline' }}>Terms</a> &amp; <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" style={{ color: '#a3a3a3', textDecoration: 'underline' }}>Privacy</a>.</p>
                  <div className="field-error" id="phoneError">Please enter your phone number</div>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="dateOfBirth">Date of Birth <span className="required">*</span></label>
                  <input type="text" id="dateOfBirth" name="dateOfBirth" autoComplete="bday" placeholder="MM/DD/YYYY" maxLength="10" required />
                  <div className="field-error" id="dateOfBirthError">Please enter a valid date (MM/DD/YYYY)</div>
                </div>
                <div className="form-group">
                  <label htmlFor="consentDate">Today's Date <span className="required">*</span></label>
                  <input type="date" id="consentDate" name="consentDate" required />
                  <div className="field-error" id="consentDateError">Please enter today's date</div>
                </div>
              </div>
            </div>
            
            {/* Health Screening */}
            <div className="section">
              <h3 className="section-title">Health Screening</h3>
              <p style={{ marginBottom: '1.5rem', color: '#404040' }}>Please answer these questions honestly. They help us ensure your safety.</p>

              <div className="warning-alert" id="warningAlert">
                <h4>⚠️ Important</h4>
                <p>Based on your answers, please discuss these items with our medical team before beginning treatment.</p>
              </div>

              <div className="health-question" id="hq1">
                <div className="health-question-text">Do you have any known allergies to medications or hormones?</div>
                <div className="radio-group">
                  <div className="radio-item"><input type="radio" id="hq1-yes" name="hq1" value="yes" required /><label htmlFor="hq1-yes">Yes</label></div>
                  <div className="radio-item"><input type="radio" id="hq1-no" name="hq1" value="no" /><label htmlFor="hq1-no">No</label></div>
                </div>
                <div className="health-detail" id="hq1-details"><textarea placeholder="Please describe your allergies..."></textarea></div>
              </div>

              <div className="health-question" id="hq2">
                <div className="health-question-text">Are you currently pregnant or nursing?</div>
                <div className="radio-group">
                  <div className="radio-item"><input type="radio" id="hq2-yes" name="hq2" value="yes" required /><label htmlFor="hq2-yes">Yes</label></div>
                  <div className="radio-item"><input type="radio" id="hq2-no" name="hq2" value="no" /><label htmlFor="hq2-no">No</label></div>
                  <div className="radio-item"><input type="radio" id="hq2-na" name="hq2" value="n/a" /><label htmlFor="hq2-na">Does not apply</label></div>
                </div>
              </div>

              <div className="health-question" id="hq3">
                <div className="health-question-text">Are you currently taking any prescription medications or supplements?</div>
                <div className="radio-group">
                  <div className="radio-item"><input type="radio" id="hq3-yes" name="hq3" value="yes" required /><label htmlFor="hq3-yes">Yes</label></div>
                  <div className="radio-item"><input type="radio" id="hq3-no" name="hq3" value="no" /><label htmlFor="hq3-no">No</label></div>
                </div>
                <div className="health-detail" id="hq3-details"><textarea placeholder="Please list your medications and supplements..."></textarea></div>
              </div>

              <div className="health-question" id="hq4">
                <div className="health-question-text">Have you ever had a blood clot, stroke, or pulmonary embolism?</div>
                <div className="radio-group">
                  <div className="radio-item"><input type="radio" id="hq4-yes" name="hq4" value="yes" required /><label htmlFor="hq4-yes">Yes</label></div>
                  <div className="radio-item"><input type="radio" id="hq4-no" name="hq4" value="no" /><label htmlFor="hq4-no">No</label></div>
                </div>
                <div className="health-detail" id="hq4-details"><textarea placeholder="Please describe..."></textarea></div>
              </div>

              <div className="health-question" id="hq5">
                <div className="health-question-text">Do you have a history of liver disease or liver problems?</div>
                <div className="radio-group">
                  <div className="radio-item"><input type="radio" id="hq5-yes" name="hq5" value="yes" required /><label htmlFor="hq5-yes">Yes</label></div>
                  <div className="radio-item"><input type="radio" id="hq5-no" name="hq5" value="no" /><label htmlFor="hq5-no">No</label></div>
                </div>
                <div className="health-detail" id="hq5-details"><textarea placeholder="Please describe..."></textarea></div>
              </div>

              <div className="health-question" id="hq6">
                <div className="health-question-text">Have you been diagnosed with any hormone-sensitive cancer (breast, prostate, uterine)?</div>
                <div className="radio-group">
                  <div className="radio-item"><input type="radio" id="hq6-yes" name="hq6" value="yes" required /><label htmlFor="hq6-yes">Yes</label></div>
                  <div className="radio-item"><input type="radio" id="hq6-no" name="hq6" value="no" /><label htmlFor="hq6-no">No</label></div>
                </div>
                <div className="health-detail" id="hq6-details"><textarea placeholder="Please describe..."></textarea></div>
              </div>

              <div className="health-question" id="hq7">
                <div className="health-question-text">Do you have a history of heart disease or cardiovascular conditions?</div>
                <div className="radio-group">
                  <div className="radio-item"><input type="radio" id="hq7-yes" name="hq7" value="yes" required /><label htmlFor="hq7-yes">Yes</label></div>
                  <div className="radio-item"><input type="radio" id="hq7-no" name="hq7" value="no" /><label htmlFor="hq7-no">No</label></div>
                </div>
                <div className="health-detail" id="hq7-details"><textarea placeholder="Please describe..."></textarea></div>
              </div>
            </div>

            {/* Patient Acknowledgments & Agreement */}
            <div className="section">
              <h3 className="section-title">Patient Acknowledgments & Agreement</h3>

              <div id="acknowledgments">
                <div className="ack-item"><label><input type="checkbox" className="ack-checkbox" name="ack1" required /><span className="ack-initials"></span><span className="ack-text">I understand that along with the benefits of hormone replacement therapy, there are both risks and potential complications. I have not been promised specific results and agree to comply with recommended dosages and protocols.</span></label></div>
                <div className="ack-item"><label><input type="checkbox" className="ack-checkbox" name="ack2" required /><span className="ack-initials"></span><span className="ack-text">I agree to comply with ongoing testing and evaluations necessary to monitor my treatment progress and safety, including laboratory tests, physical examinations, and preventive screenings as recommended by my physician.</span></label></div>
                <div className="ack-item"><label><input type="checkbox" className="ack-checkbox" name="ack3" required /><span className="ack-initials"></span><span className="ack-text">I agree to immediately report any adverse reactions, side effects, or complications related to my therapy to Range Medical.</span></label></div>
                <div className="ack-item"><label><input type="checkbox" className="ack-checkbox" name="ack4" required /><span className="ack-initials"></span><span className="ack-text">I confirm that I have disclosed all relevant medical information, including allergies, current medications, history of blood clots, liver disease, cardiovascular conditions, and hormone-sensitive cancers.</span></label></div>
                <div className="ack-item"><label><input type="checkbox" className="ack-checkbox" name="ack5" required /><span className="ack-initials"></span><span className="ack-text">I acknowledge that insurance may not cover services provided by Range Medical. I agree to assume full financial responsibility for all charges associated with treatment.</span></label></div>
                <div className="ack-item"><label><input type="checkbox" className="ack-checkbox" name="ack6" required /><span className="ack-initials"></span><span className="ack-text">I understand that HRT is not a substitute for routine medical care. I should continue to see my primary care physician and specialists for ongoing health management.</span></label></div>
                <div className="ack-item"><label><input type="checkbox" className="ack-checkbox" name="ack7" required /><span className="ack-initials"></span><span className="ack-text">I understand that I have the right to refuse or discontinue treatment at any time without penalty.</span></label></div>
                <div className="ack-item"><label><input type="checkbox" className="ack-checkbox" name="ack8" required /><span className="ack-initials"></span><span className="ack-text">I voluntarily assume full responsibility for any risks associated with HRT. I release, discharge, and hold harmless Range Medical, its medical director, physicians, nurse practitioners, staff, and affiliated entities from claims arising out of treatment, except in cases of gross negligence or willful misconduct.</span></label></div>
                <div className="ack-item"><label><input type="checkbox" className="ack-checkbox" name="ack9" required /><span className="ack-initials"></span><span className="ack-text">I confirm that I am at least 18 years of age, that I have read this consent form in its entirety, that I have had the opportunity to ask questions, and that I am signing voluntarily.</span></label></div>
              </div>
              <div className="field-error" id="consentError">Please initial all acknowledgments above</div>
            </div>
            
            {/* Signature */}
            <div className="section">
              <h3 className="section-title">Patient Signature</h3>
              
              <div className="signature-wrapper">
                <span className="signature-label">Sign Below <span className="required">*</span></span>
                <div className="signature-pad-container" id="signatureContainer">
                  <canvas id="signaturePad"></canvas>
                  <div className="signature-placeholder" id="signaturePlaceholder">Sign here using your mouse or touchscreen</div>
                </div>
                <div className="field-error" id="signatureError">Please provide your signature</div>
                <div className="signature-controls">
                  <button type="button" className="btn-clear" id="clearSignature">Clear Signature</button>
                </div>
              </div>
              
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginTop: '1rem' }}>
                By signing above, I certify that I am the patient (or authorized representative) and that the information provided is accurate. My signature indicates my voluntary consent to hormone replacement therapy at Range Medical.
              </p>
            </div>
            
            {/* Submit */}
            <div className="submit-section">
              <div className="validation-summary" id="validationSummary">
                <h3>Please complete the following required fields:</h3>
                <ul id="validationList"></ul>
              </div>
              <button type="submit" className="btn-submit" id="submitBtn">Submit Consent Form</button>
            </div>
          </form>
        </div>

        <footer className="consent-footer">
          <p>&copy; 2026 Range Medical. All rights reserved.</p>
          <p>Your information is protected and kept confidential.</p>
        </footer>
      </div>
    </>
  );
}

function initializeForm() {
  if (typeof window === 'undefined') return;

  // ============================================
  // CONFIGURATION
  // ============================================
  const CONFIG = {
    consentType: 'hrt',
    consentTitle: 'HRT Consent',
    supabase: {
      url: 'https://teivfptpozltpqwahgdl.supabase.co',
      anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlaXZmcHRwb3psdHBxd2FoZ2RsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3MTMxNDksImV4cCI6MjA4MDI4OTE0OX0.NrI1AykMBOh91mM9BFvpSH0JwzGrkv5ADDkZinh0elc'
    },
    api: {
      consents: '/api/consent-forms'
    },
    recipientEmail: 'cupp@range-medical.com, intake@range-medical.com'
  };

  // ============================================
  // SUPABASE CLIENT
  // ============================================
  const urlParams = new URLSearchParams(window.location.search);

  const supabaseClient = window.supabase.createClient(CONFIG.supabase.url, CONFIG.supabase.anonKey);

  // Pre-fill from bundle query params
  ['fn:firstName','ln:lastName','em:email','ph:phone','dob:dateOfBirth'].forEach(p => {
    const [k, id] = p.split(':');
    const v = urlParams.get(k);
    if (v) { const el = document.getElementById(id); if (el) el.value = v; }
  });

  // ============================================
  // SIGNATURE PAD SETUP
  // ============================================
  let signaturePad;
  const canvas = document.getElementById('signaturePad');
  if (!canvas) return;

  function initSignaturePad() {
    const container = canvas.parentElement;
    
    function resizeCanvas() {
      const ratio = 1;
      canvas.width = container.offsetWidth * ratio;
      canvas.height = 200 * ratio;
      canvas.style.width = container.offsetWidth + 'px';
      canvas.style.height = '200px';
      canvas.getContext('2d').scale(ratio, ratio);
      if (signaturePad && !signaturePad.isEmpty()) {
        const data = signaturePad.toData();
        signaturePad.fromData(data);
      }
    }
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    signaturePad = new window.SignaturePad(canvas, {
      backgroundColor: 'rgb(255, 255, 255)',
      penColor: 'rgb(0, 0, 0)',
      minWidth: 1,
      maxWidth: 2.5
    });
    
    signaturePad.addEventListener('beginStroke', () => {
      document.getElementById('signaturePlaceholder').style.display = 'none';
      document.getElementById('signatureContainer').classList.remove('error');
      document.getElementById('signatureError').classList.remove('visible');
    });
    
    document.getElementById('clearSignature').addEventListener('click', () => {
      signaturePad.clear();
      document.getElementById('signaturePlaceholder').style.display = 'block';
    });
  }

  initSignaturePad();
  
  // Set today's date
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('consentDate').value = today;
  
  // ============================================
  // DATE OF BIRTH AUTO-FORMATTING
  // ============================================
  const dobInput = document.getElementById('dateOfBirth');
  dobInput.addEventListener('input', function(e) {
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

  // ============================================
  // HEALTH SCREENING LOGIC
  // ============================================
  function checkHealthQuestions() {
    const warningQuestions = ['hq1', 'hq2', 'hq3', 'hq4', 'hq5', 'hq6', 'hq7'];
    let showWarning = false;
    warningQuestions.forEach(q => {
      const yesRadio = document.getElementById(q + '-yes');
      if (yesRadio && yesRadio.checked) {
        showWarning = true;
        document.getElementById(q).classList.add('warning');
      } else {
        document.getElementById(q).classList.remove('warning');
      }
    });
    const warningAlert = document.getElementById('warningAlert');
    if (showWarning) warningAlert.classList.add('visible');
    else warningAlert.classList.remove('visible');
  }

  // Conditional detail fields
  ['hq1', 'hq3', 'hq4', 'hq5', 'hq6', 'hq7'].forEach(q => {
    document.querySelectorAll('input[name="' + q + '"]').forEach(radio => {
      radio.addEventListener('change', function() {
        const details = document.getElementById(q + '-details');
        if (details) details.style.display = (this.value === 'yes') ? 'block' : 'none';
        checkHealthQuestions();
      });
    });
  });
  document.querySelectorAll('input[name="hq2"]').forEach(radio => {
    radio.addEventListener('change', checkHealthQuestions);
  });

  // ============================================
  // INITIALS FOR ACKNOWLEDGMENTS
  // ============================================
  function updateInitials() {
    const first = (document.getElementById('firstName')?.value || '').trim();
    const last = (document.getElementById('lastName')?.value || '').trim();
    const initials = ((first.charAt(0) || '') + (last.charAt(0) || '')).toUpperCase();
    document.querySelectorAll('.ack-initials').forEach(el => { el.textContent = initials; });
  }
  document.getElementById('firstName')?.addEventListener('input', updateInitials);
  document.getElementById('lastName')?.addEventListener('input', updateInitials);
  updateInitials();

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
  
  // Clear errors on input
  document.querySelectorAll('input[required]').forEach(input => {
    input.addEventListener('input', () => {
      input.classList.remove('error');
      const errorEl = document.getElementById(input.id + 'Error');
      if (errorEl) errorEl.classList.remove('visible');
    });
  });
  
  document.querySelectorAll('.ack-checkbox').forEach(cb => {
    cb.addEventListener('change', () => {
      cb.closest('.ack-item').style.borderColor = '';
      document.getElementById('consentError').classList.remove('visible');
    });
  });

  // ============================================
  // FORM VALIDATION
  // ============================================
  function validateForm() {
    let isValid = true;
    const missingFields = [];

    // Clear previous validation summary
    const summaryEl = document.getElementById('validationSummary');
    const listEl = document.getElementById('validationList');
    summaryEl.classList.remove('visible');
    listEl.innerHTML = '';

    const fieldLabels = { firstName: 'First Name', lastName: 'Last Name', email: 'Email', phone: 'Phone', consentDate: 'Consent Date' };
    const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'consentDate'];
    requiredFields.forEach(fieldId => {
      const field = document.getElementById(fieldId);
      const error = document.getElementById(fieldId + 'Error');
      if (!field.value.trim()) {
        field.classList.add('error');
        if (error) error.classList.add('visible');
        isValid = false;
        missingFields.push(fieldLabels[fieldId]);
      } else {
        field.classList.remove('error');
        if (error) error.classList.remove('visible');
      }
    });

    const dob = document.getElementById('dateOfBirth');
    const dobError = document.getElementById('dateOfBirthError');
    if (!dob.value.trim() || !isValidDOB(dob.value)) {
      dob.classList.add('error');
      if (dobError) dobError.classList.add('visible');
      isValid = false;
      missingFields.push('Date of Birth');
    } else {
      dob.classList.remove('error');
      if (dobError) dobError.classList.remove('visible');
    }

    // Validate health screening
    const hqLabels = { hq1: 'Medication allergies', hq2: 'Pregnancy', hq3: 'Current medications', hq4: 'Blood clot history', hq5: 'Liver disease', hq6: 'Hormone-sensitive cancer', hq7: 'Heart disease' };
    const unanswered = [];
    for (let i = 1; i <= 7; i++) {
      const name = 'hq' + i;
      const radios = document.querySelectorAll('input[name="' + name + '"]');
      const anyChecked = Array.from(radios).some(r => r.checked);
      if (!anyChecked) {
        unanswered.push(hqLabels[name]);
        const el = document.getElementById(name);
        if (el) el.classList.add('has-error');
      }
    }
    if (unanswered.length > 0) {
      isValid = false;
      missingFields.push('Health Questions: ' + unanswered.join(', '));
    }

    // Validate acknowledgments
    const ackBoxes = document.querySelectorAll('.ack-checkbox');
    const uncheckedAcks = Array.from(ackBoxes).filter(cb => !cb.checked);
    if (uncheckedAcks.length > 0) {
      uncheckedAcks.forEach(cb => cb.closest('.ack-item').style.borderColor = '#dc2626');
      document.getElementById('consentError').classList.add('visible');
      isValid = false;
      missingFields.push('Acknowledgments (' + uncheckedAcks.length + ' remaining)');
    } else {
      document.getElementById('consentError').classList.remove('visible');
    }

    if (signaturePad.isEmpty()) {
      document.getElementById('signatureContainer').classList.add('error');
      document.getElementById('signatureError').classList.add('visible');
      isValid = false;
      missingFields.push('Signature');
    }

    if (!isValid) {
      listEl.innerHTML = missingFields.map(f => '<li>' + f + '</li>').join('');
      summaryEl.classList.add('visible');
      summaryEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    return isValid;
  }

  // ============================================
  // COLLECT FORM DATA
  // ============================================
  function collectFormData() {
    const healthAnswers = {};
    for (let i = 1; i <= 7; i++) {
      const checked = document.querySelector('input[name="hq' + i + '"]:checked');
      healthAnswers['hq' + i] = checked ? checked.value : 'not answered';
      const details = document.querySelector('#hq' + i + '-details textarea');
      if (details && details.value.trim()) healthAnswers['hq' + i + '_details'] = details.value.trim();
    }

    return {
      firstName: document.getElementById('firstName').value.trim(),
      lastName: document.getElementById('lastName').value.trim(),
      email: document.getElementById('email').value.trim(),
      phone: document.getElementById('phone').value.trim(),
      dateOfBirth: document.getElementById('dateOfBirth').value,
      consentDate: document.getElementById('consentDate').value,
      healthAnswers: healthAnswers,
      consentGiven: Array.from(document.querySelectorAll('.ack-checkbox')).every(cb => cb.checked),
      acknowledgments: Array.from(document.querySelectorAll('.ack-checkbox')).map((cb, i) => ({
        id: 'ack' + (i + 1),
        text: cb.closest('label').querySelector('.ack-text').textContent,
        checked: cb.checked
      })),
      signature: signaturePad.toDataURL('image/jpeg', 0.5),
      submissionDate: new Date().toLocaleString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit', timeZone: 'America/Los_Angeles',
      })
    };
  }

  // ============================================
  // UPLOAD TO SUPABASE STORAGE
  // ============================================
  async function uploadBase64ToStorage(base64Data, folder, patientName, extension = 'png') {
    try {
      const timestamp = Date.now();
      const safeName = patientName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
      const fileName = `${safeName}-${timestamp}.${extension}`;
      const filePath = `${folder}/${fileName}`;
      
      const base64Content = base64Data.split(',')[1];
      const mimeType = base64Data.split(';')[0].split(':')[1] || 'image/png';
      const byteCharacters = atob(base64Content);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });
      
      const { data, error } = await supabaseClient.storage
        .from('medical-documents')
        .upload(filePath, blob, { contentType: mimeType, cacheControl: '3600', upsert: false });
      
      if (error) throw error;
      
      const { data: { publicUrl } } = supabaseClient.storage
        .from('medical-documents')
        .getPublicUrl(filePath);
      
      return publicUrl;
    } catch (error) {
      console.error(`Error uploading ${folder}:`, error);
      return null;
    }
  }

  async function uploadPDFToStorage(pdfBlob, formData) {
    try {
      const timestamp = Date.now();
      const fileName = `hrt-consent-${formData.firstName}-${formData.lastName}-${timestamp}.pdf`;
      const filePath = `consents/${fileName}`;
      
      const { data, error } = await supabaseClient.storage
        .from('medical-documents')
        .upload(filePath, pdfBlob, { contentType: 'application/pdf', cacheControl: '3600', upsert: false });
      
      if (error) throw error;
      
      const { data: { publicUrl } } = supabaseClient.storage
        .from('medical-documents')
        .getPublicUrl(filePath);
      
      return publicUrl;
    } catch (error) {
      console.error('Error uploading PDF:', error);
      throw error;
    }
  }

  // ============================================
  // GENERATE PDF
  // ============================================
  function generatePDF(formData) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ compress: true });
    const leftMargin = 15;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const contentWidth = pageWidth - 30;
    let yPos = 15;

    function checkPageBreak(needed) {
      if (yPos + needed > pageHeight - 25) {
        doc.addPage();
        yPos = 15;
      }
    }

    function addText(text, fontSize, isBold, color) {
      fontSize = fontSize || 9;
      isBold = isBold || false;
      color = color || [0, 0, 0];
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', isBold ? 'bold' : 'normal');
      doc.setTextColor(color[0], color[1], color[2]);
      var lines = doc.splitTextToSize(text, contentWidth);
      checkPageBreak(lines.length * (fontSize * 0.45) + 4);
      doc.text(lines, leftMargin, yPos);
      yPos += lines.length * (fontSize * 0.45) + 2;
    }

    function addSectionHeader(text) {
      checkPageBreak(15);
      yPos += 4;
      doc.setFillColor(0, 0, 0);
      doc.rect(leftMargin, yPos - 4, contentWidth, 8, 'F');
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text(text.toUpperCase(), leftMargin + 3, yPos + 1);
      doc.setTextColor(0, 0, 0);
      yPos += 8;
    }

    function addLabelValue(label, value) {
      checkPageBreak(8);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(label, leftMargin, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(value || 'N/A', leftMargin + doc.getTextWidth(label) + 2, yPos);
      yPos += 5;
    }

    // ========== BLACK HEADER BAR ==========
    doc.setFillColor(0, 0, 0);
    doc.rect(0, 0, pageWidth, 22, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('RANGE MEDICAL', leftMargin, 10);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Hormone Replacement Therapy — Informed Consent', leftMargin, 16);
    doc.setFontSize(8);
    doc.text('Document Date: ' + formData.consentDate, pageWidth - 15, 10, { align: 'right' });
    doc.text('1901 Westcliff Dr, Suite 10, Newport Beach, CA 92660', pageWidth - 15, 16, { align: 'right' });
    doc.setTextColor(0, 0, 0);
    yPos = 28;

    // ========== PATIENT INFORMATION ==========
    addSectionHeader('Patient Information');
    addLabelValue('Patient Name: ', formData.firstName + ' ' + formData.lastName);
    addLabelValue('Date of Birth: ', formData.dateOfBirth);
    addLabelValue('Email: ', formData.email);
    addLabelValue('Phone: ', formData.phone);
    addLabelValue('Consent Date: ', formData.consentDate);
    yPos += 2;

    // ========== HEALTH SCREENING ==========
    addSectionHeader('Health Screening Responses');

    var hqLabels = [
      'Allergies to medications or hormones',
      'Currently pregnant or nursing',
      'Currently taking prescription medications or supplements',
      'History of blood clot, stroke, or pulmonary embolism',
      'History of liver disease',
      'Hormone-sensitive cancer (breast, prostate, uterine)',
      'History of heart disease or cardiovascular conditions'
    ];

    var yesAnswers = [];
    hqLabels.forEach(function(label, i) {
      var answer = formData.healthAnswers['hq' + (i + 1)];
      if (answer === 'yes') yesAnswers.push(label);
    });

    if (yesAnswers.length > 0) {
      checkPageBreak(12 + yesAnswers.length * 5);
      doc.setFillColor(254, 243, 199);
      var boxHeight = 10 + (yesAnswers.length * 5);
      doc.rect(leftMargin, yPos - 3, contentWidth, boxHeight, 'F');
      doc.setDrawColor(245, 158, 11);
      doc.setLineWidth(0.5);
      doc.rect(leftMargin, yPos - 3, contentWidth, boxHeight, 'S');
      doc.setTextColor(146, 64, 14);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text('ATTENTION: Patient answered YES to:', leftMargin + 3, yPos + 2);
      yPos += 6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      yesAnswers.forEach(function(q) { doc.text('• ' + q, leftMargin + 6, yPos); yPos += 4.5; });
      doc.setTextColor(0, 0, 0);
      doc.setDrawColor(0);
      yPos += 4;
    }

    hqLabels.forEach(function(label, i) {
      var answer = formData.healthAnswers['hq' + (i + 1)];
      addLabelValue((i + 1) + '. ' + label + ': ', (answer || 'not answered').toUpperCase());
      var details = formData.healthAnswers['hq' + (i + 1) + '_details'];
      if (details) { addText('   Details: ' + details, 8); }
    });
    yPos += 2;

    // ========== PATIENT ACKNOWLEDGMENTS ==========
    addSectionHeader('Patient Acknowledgments & Agreement');

    var initials = ((formData.firstName.charAt(0) || '') + (formData.lastName.charAt(0) || '')).toUpperCase();

    function addCheckboxLine(text, checked) {
      checkPageBreak(12);
      doc.setDrawColor(0);
      doc.setLineWidth(0.5);
      if (checked) {
        doc.setFillColor(0, 0, 0);
        doc.rect(leftMargin, yPos - 3.5, 7, 7, 'FD');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(6);
        doc.setFont('helvetica', 'bold');
        doc.text(initials, leftMargin + 3.5, yPos + 0.5, { align: 'center' });
        doc.setTextColor(0, 0, 0);
      } else {
        doc.rect(leftMargin, yPos - 3.5, 7, 7, 'S');
      }
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      var lines = doc.splitTextToSize(text, contentWidth - 12);
      doc.text(lines, leftMargin + 10, yPos);
      yPos += lines.length * 3.5 + 4;
    }

    var ackTexts = formData.acknowledgments || [];
    ackTexts.forEach(function(ack) { addCheckboxLine(ack.text, ack.checked); });
    yPos += 2;

    // ========== PATIENT SIGNATURE ==========
    addSectionHeader('Patient Signature');
    addText('By affixing my signature below, I certify that I have read this consent form in its entirety, that all of my questions have been answered to my satisfaction, and that I voluntarily consent to hormone replacement therapy at Range Medical.', 8.5);
    yPos += 3;
    addLabelValue('Signed by: ', formData.firstName + ' ' + formData.lastName);
    addLabelValue('Date: ', formData.consentDate);
    yPos += 2;

    if (formData.signature && formData.signature.startsWith('data:')) {
      checkPageBreak(35);
      try {
        doc.addImage(formData.signature, 'JPEG', leftMargin, yPos, 60, 25);
        yPos += 28;
      } catch (e) {
        console.error('Error adding signature:', e);
      }
    }

    // ========== FOOTER ON ALL PAGES ==========
    var totalPages = doc.internal.getNumberOfPages();
    for (var i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(130);
      doc.text('Page ' + i + ' of ' + totalPages, pageWidth - 15, pageHeight - 4, { align: 'right' });
      doc.text('Range Medical | 1901 Westcliff Dr, Suite 10, Newport Beach, CA 92660 | (949) 997-3988', pageWidth / 2, pageHeight - 8, { align: 'center' });
      doc.text('CONFIDENTIAL — HRT Consent', pageWidth / 2, pageHeight - 4, { align: 'center' });
    }

    return doc.output('blob');
  }

  // ============================================
  // SAVE TO DATABASE
  // ============================================
  async function saveToDatabase(formData, urls) {
    try {
      const response = await fetch(CONFIG.api.consents, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consentType: CONFIG.consentType,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          dateOfBirth: formData.dateOfBirth,
          consentDate: formData.consentDate,
          consentGiven: formData.consentGiven,
          signatureUrl: urls.signatureUrl,
          pdfUrl: urls.pdfUrl,
          additionalData: { healthAnswers: formData.healthAnswers, acknowledgments: formData.acknowledgments }
        })
      });
      return await response.json();
    } catch (error) {
      console.error('Error saving to database:', error);
      return { success: false, error: error.message };
    }
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
    const bundleToken = urlParams.get('bundle');
    if (bundleToken) { window.location.href = '/forms/' + bundleToken; return; }
    document.getElementById('consentContainer').innerHTML = `
      <div class="thank-you-page">
        <div class="thank-you-icon">✓</div>
        <h1>Thank You, ${formData.firstName}!</h1>
        <p class="thank-you-subtitle">Your consent form has been successfully submitted.</p>
        <div class="thank-you-details">
          <p>Your hormone replacement therapy consent form has been successfully submitted to Range Medical.</p>
          <p>Our team will review your consent and we look forward to supporting your health journey.</p>
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

  document.getElementById('consentForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Processing...';
    
    try {
      showStatus('Collecting form data...', 'loading');
      const formData = collectFormData();
      const patientName = `${formData.firstName}-${formData.lastName}`;
      
      showStatus('Uploading signature...', 'loading');
      let signatureUrl = null;
      if (formData.signature && formData.signature.startsWith('data:')) {
        signatureUrl = await uploadBase64ToStorage(formData.signature, 'signatures', patientName, 'jpg');
      }
      
      showStatus('Generating PDF...', 'loading');
      const pdfBlob = generatePDF(formData);
      
      showStatus('Uploading consent form...', 'loading');
      const pdfUrl = await uploadPDFToStorage(pdfBlob, formData);
      
      const urls = { signatureUrl, pdfUrl };
      
      showStatus('Saving consent record...', 'loading');
      await saveToDatabase(formData, urls);

      showThankYouPage(formData);
      
    } catch (error) {
      console.error('Submission error:', error);
      showStatus('Error: ' + (error.message || 'Unknown error'), 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Consent Form';
    }
  });
}
