import Head from 'next/head';
import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

export default function WeightLossConsent() {
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
        <title>Weight Management Program Consent | Range Medical</title>
        <meta name="description" content="Compounded weight management program consent form for Range Medical." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex, nofollow" />
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
        .consent-container input[type="text"],.consent-container input[type="email"],.consent-container input[type="tel"],.consent-container input[type="date"],.consent-container select,.consent-container textarea { width: 100%; padding: 10px 12px; font-size: 14px; font-family: inherit; border: 1px solid #ccc; background: #fff; color: #111; border-radius: 4px; transition: border-color 0.2s ease; }
        .consent-container input:focus,.consent-container select:focus,.consent-container textarea:focus { outline: none; border-color: #000; box-shadow: 0 0 0 2px rgba(0,0,0,0.1); }
        .consent-container input.error,.consent-container select.error,.consent-container textarea.error { border-color: #dc2626; }
        .consent-text { background: #fafafa; border: 1px solid #e5e5e5; border-radius: 6px; padding: 20px; margin-bottom: 16px; line-height: 1.6; }
        .consent-text h4 { font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px; color: #262626; }
        .consent-text p { margin-bottom: 12px; color: #333; font-size: 14px; line-height: 1.6; }
        .consent-text p:last-child { margin-bottom: 0; }
        .consent-text ul { margin-left: 1.5rem; margin-bottom: 12px; }
        .consent-text li { margin-bottom: 6px; color: #333; font-size: 14px; line-height: 1.5; }
        .consent-text strong { font-weight: 600; }
        .checkbox-consent { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 16px; padding: 14px 16px; background: #fafafa; border: 1px solid #e5e5e5; border-radius: 6px; }
        .checkbox-consent input[type="checkbox"] { width: 18px; height: 18px; margin-top: 3px; cursor: pointer; accent-color: #000; flex-shrink: 0; }
        .checkbox-consent label { font-size: 13px; font-weight: 500; text-transform: none; letter-spacing: normal; margin-bottom: 0; cursor: pointer; color: #333; line-height: 1.55; }
        .checkbox-consent.error { border-color: #dc2626; background: #fef2f2; }
        .signature-wrapper { margin-bottom: 16px; }
        .signature-label { font-size: 13px; font-weight: 600; margin-bottom: 8px; color: #333; display: block; text-transform: none; letter-spacing: normal; }
        .signature-pad-container { border: 2px solid #000; border-radius: 6px; background: #fff; position: relative; margin-bottom: 8px; overflow: hidden; }
        .signature-pad-container.error { border-color: #dc2626; }
        #signaturePad { display: block; width: 100%; height: 150px; cursor: crosshair; touch-action: none; }
        .signature-placeholder { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); color: #a3a3a3; font-size: 14px; pointer-events: none; text-align: center; }
        .signature-controls { text-align: right; }
        .btn-clear { background: none; border: 1px solid #ccc; padding: 6px 14px; border-radius: 4px; cursor: pointer; font-size: 13px; font-family: inherit; }
        .btn-clear:hover { background: #f5f5f5; }
        .field-error { font-size: 12px; color: #dc2626; margin-top: 4px; display: none; }
        .field-error.visible { display: block; }
        .submit-section { padding-top: 20px; text-align: center; }
        .btn-submit { background: #000; color: #fff; border: none; padding: 14px 48px; font-size: 16px; font-weight: 600; border-radius: 6px; cursor: pointer; letter-spacing: 0.5px; font-family: inherit; min-width: 250px; }
        .btn-submit:hover:not(:disabled) { background: #222; }
        .btn-submit:disabled { background: #999; cursor: not-allowed; }
        .validation-summary { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 1rem 1.5rem; margin-bottom: 1rem; display: none; }
        .validation-summary.visible { display: block; }
        .validation-summary h3 { color: #991b1b; font-size: 0.9375rem; margin-bottom: 0.5rem; }
        .validation-summary ul { margin: 0; padding-left: 1.25rem; color: #dc2626; font-size: 0.875rem; }
        .validation-summary ul li { margin-bottom: 0.25rem; }
        .status-message { margin-top: 16px; padding: 12px; border-radius: 6px; font-size: 14px; text-align: center; display: none; }
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
        @media (max-width: 640px) { .consent-header { padding: 20px 16px; } .form-container { padding: 0 16px 30px; } .form-row { flex-direction: column; gap: 12px; } }
      `}</style>

      <div className="consent-container" id="consentContainer">
        <div className="consent-header">
          <h1 className="clinic-name">RANGE MEDICAL</h1>
          <p className="form-title">Compounded Weight Management Program — Informed Consent</p>
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
                  <input type="text" id="firstName" name="firstName" required />
                  <div className="field-error" id="firstNameError">Please enter your first name</div>
                </div>
                <div className="form-group">
                  <label htmlFor="lastName">Last Name <span className="required">*</span></label>
                  <input type="text" id="lastName" name="lastName" required />
                  <div className="field-error" id="lastNameError">Please enter your last name</div>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="email">Email <span className="required">*</span></label>
                  <input type="email" id="email" name="email" required />
                  <div className="field-error" id="emailError">Please enter a valid email</div>
                </div>
                <div className="form-group">
                  <label htmlFor="phone">Phone <span className="required">*</span></label>
                  <input type="tel" id="phone" name="phone" required />
                  <p style={{ fontSize: '0.6rem', color: '#a3a3a3', lineHeight: 1.4, marginTop: '0.25rem' }}>By providing my phone number, I agree to receive texts from Range Medical. Msg &amp; data rates may apply. Up to 10 msg/mo. Reply STOP to opt out. <a href="/terms-of-use" target="_blank" rel="noopener noreferrer" style={{ color: '#a3a3a3', textDecoration: 'underline' }}>Terms</a> &amp; <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" style={{ color: '#a3a3a3', textDecoration: 'underline' }}>Privacy</a>.</p>
                  <div className="field-error" id="phoneError">Please enter your phone number</div>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="dateOfBirth">Date of Birth <span className="required">*</span></label>
                  <input type="text" id="dateOfBirth" name="dateOfBirth" placeholder="MM/DD/YYYY" maxLength="10" required />
                  <div className="field-error" id="dateOfBirthError">Please enter a valid date (MM/DD/YYYY)</div>
                </div>
                <div className="form-group">
                  <label htmlFor="consentDate">Today's Date <span className="required">*</span></label>
                  <input type="date" id="consentDate" name="consentDate" required />
                  <div className="field-error" id="consentDateError">Please enter today's date</div>
                </div>
              </div>
            </div>
            
            {/* Program Information & Consent */}
            <div className="section">
              <h3 className="section-title">Program Information & Consent</h3>
              
              <div className="consent-text">
                <h4>Purpose of Treatment and General Information</h4>
                <p><strong>What is Compounded Weight Management Therapy?</strong></p>
                <p>This treatment is designed to support healthy, sustainable weight loss in conjunction with diet and lifestyle modifications. Your provider may prescribe compounded medications from a licensed compounding pharmacy to help:</p>
                <ul>
                  <li>Decrease appetite and cravings</li>
                  <li>Improve metabolism and blood sugar balance</li>
                  <li>Enhance satiety and reduce overeating</li>
                  <li>Support fat loss and overall metabolic health</li>
                </ul>
                <p>This therapy is administered by subcutaneous injection (under the skin), typically once per week, and is most effective when combined with a balanced, high-protein diet, consistent physical activity, adequate hydration and sleep. Potential benefits may include improvements in body composition, blood sugar regulation, energy, and cardiovascular health.</p>
                
                <h4>What to Expect</h4>
                <p><strong>Initial Consultation & Screening:</strong> Your treatment begins with a consultation to review your medical and medication history, determine your eligibility for treatment, order lab work to assess key health markers, and record your baseline weight and metabolic profile.</p>
                <p><strong>Injection Administration & Dosage Adjustments:</strong> Your first injection may be administered in-office to monitor your response. You will typically receive 4 pre-filled syringes per month for self-administration, or you may choose weekly in-office injections. Dosage will be titrated gradually based on your individual response and tolerance.</p>
                <p><strong>Weight Loss Expectations:</strong> Results vary based on consistency, lifestyle, and adherence to your plan. Noticeable weight loss may take several weeks to months. This therapy is not a permanent solution; maintaining results requires long-term nutrition and lifestyle habits.</p>
                
                <h4>Diet & Lifestyle Recommendations</h4>
                <ul>
                  <li>Eat a high-fiber diet with fruits and vegetables</li>
                  <li>Consume small, protein-rich meals to promote satiety</li>
                  <li>Avoid high-fat or spicy foods to minimize digestive discomfort</li>
                  <li>Limit alcohol intake, as it may affect blood pressure and hydration</li>
                  <li>Drink at least 40 oz of water daily to prevent dehydration and constipation</li>
                </ul>
                
                <h4>Possible Risks & Side Effects</h4>
                <p><strong>Common Side Effects</strong> (often improve with time):</p>
                <ul>
                  <li>Nausea</li>
                  <li>Constipation</li>
                  <li>Diarrhea</li>
                  <li>Indigestion</li>
                  <li>Abdominal discomfort</li>
                  <li>Fatigue or dizziness</li>
                </ul>
                
                <p><strong>Serious Risks — When to Seek Immediate Medical Attention:</strong></p>
                <p>Stop the medication and seek urgent medical care if you experience:</p>
                <ul>
                  <li>Severe allergic reaction (rash, swelling of face/tongue/throat, difficulty breathing)</li>
                  <li>Severe abdominal pain, nausea, or vomiting</li>
                  <li>Signs of low blood sugar (sweating, shakiness, confusion, blurred vision)</li>
                  <li>Persistent upper-right abdominal pain or yellowing of the skin/eyes</li>
                </ul>
                
                <h4>Contraindications — Who Should Not Use This Treatment</h4>
                <p>This program may not be appropriate if you:</p>
                <ul>
                  <li>Are currently using another weight-management or appetite-suppressing medication</li>
                  <li>Are pregnant, planning pregnancy (must stop 2 months prior), or breastfeeding</li>
                  <li>Have a history of endocrine or metabolic disorders requiring specialist oversight</li>
                  <li>Have had an allergic reaction to any ingredients in compounded weight-loss medications</li>
                </ul>
                <p><strong>Use with caution if you have:</strong></p>
                <ul>
                  <li>A history of pancreatitis, kidney disease, or gallbladder issues</li>
                  <li>Type 1 or Type 2 diabetes, or are taking insulin or sulfonylureas</li>
                  <li>Depression, anxiety, or a history of suicidal thoughts</li>
                </ul>
                
                <h4>Long-Term Use & Maintenance</h4>
                <p>Some patients may reduce or discontinue therapy under medical supervision. Maintenance doses may help stabilize weight long term. Stopping therapy abruptly may lead to weight regain if healthy habits are not continued.</p>
                
                <h4>Financial Agreement & Liability Waiver</h4>
                <p><strong>I understand that:</strong></p>
                <ul>
                  <li>Compounded weight-management treatments are not covered by insurance and are self-pay</li>
                  <li>There are no refunds once treatment begins</li>
                  <li>Results vary and are not guaranteed</li>
                  <li>I agree not to dispute or reverse payments. If a chargeback is initiated, I am responsible for collection, court, and legal fees</li>
                  <li>Prices may change, and I agree to pay the rates in effect at the time of treatment</li>
                </ul>
              </div>
              
              <div className="checkbox-consent" id="consentCheckbox">
                <input type="checkbox" id="consentGiven" name="consentGiven" required />
                <label htmlFor="consentGiven">
                  <strong>I acknowledge and consent:</strong> I have disclosed all relevant medical information, medications, and allergies. I have read and understand the potential benefits, risks, and expectations of treatment. All my questions have been answered to my satisfaction. I consent to participate in the Range Medical Compounded Weight Management Program under medical supervision. I release Range Medical, its providers, and staff from any liability except in cases of gross negligence or misconduct.
                </label>
              </div>
              <div className="field-error" id="consentError">You must provide consent to continue</div>
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
                By signing above, I certify that I am the patient (or authorized representative) and that the information provided is accurate. My signature indicates my voluntary consent to participate in the Range Medical Compounded Weight Management Program.
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
    supabase: {
      url: 'https://teivfptpozltpqwahgdl.supabase.co',
      anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlaXZmcHRwb3psdHBxd2FoZ2RsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3MTMxNDksImV4cCI6MjA4MDI4OTE0OX0.NrI1AykMBOh91mM9BFvpSH0JwzGrkv5ADDkZinh0elc'
    },
    api: {
      consents: '/api/consent-forms',
      ghl: '/api/consent-to-ghl'
    },
    ghl: {
      customFieldKey: 'weight_loss_consent',
      tags: ['weight-loss-consent-signed', 'consent-completed']
    },
    consentType: 'weight-loss',
    recipientEmail: 'cupp@range-medical.com, intake@range-medical.com'
  };

  const urlParams = new URLSearchParams(window.location.search);
  const ghlContactId = urlParams.get('contactId') || urlParams.get('contact_id') || urlParams.get('cid') || '';

  const supabaseClient = window.supabase.createClient(CONFIG.supabase.url, CONFIG.supabase.anonKey);

  // ============================================
  // SIGNATURE PAD
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

  // ============================================
  // DATE OF BIRTH AUTO-FORMATTING
  // ============================================
  const dobInput = document.getElementById('dateOfBirth');
  dobInput.addEventListener('input', function(e) {
    let value = e.target.value.replace(/\D/g, '');
    
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

  function isValidDOB(dateStr) {
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return false;
    
    const [month, day, year] = dateStr.split('/').map(Number);
    const date = new Date(year, month - 1, day);
    
    return date.getFullYear() === year && 
           date.getMonth() === month - 1 && 
           date.getDate() === day &&
           year >= 1900 && year <= new Date().getFullYear();
  }

  // Set today's date
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('consentDate').value = today;

  // Clear errors on input
  document.querySelectorAll('input[required]').forEach(input => {
    input.addEventListener('input', () => {
      input.classList.remove('error');
      const errorEl = document.getElementById(input.id + 'Error');
      if (errorEl) errorEl.classList.remove('visible');
    });
  });

  document.getElementById('consentGiven').addEventListener('change', () => {
    document.getElementById('consentCheckbox').classList.remove('error');
    document.getElementById('consentError').classList.remove('visible');
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

    const consentCheckbox = document.getElementById('consentGiven');
    if (!consentCheckbox.checked) {
      document.getElementById('consentCheckbox').classList.add('error');
      document.getElementById('consentError').classList.add('visible');
      isValid = false;
      missingFields.push('Consent Checkbox');
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
    return {
      firstName: document.getElementById('firstName').value.trim(),
      lastName: document.getElementById('lastName').value.trim(),
      email: document.getElementById('email').value.trim(),
      phone: document.getElementById('phone').value.trim(),
      dateOfBirth: document.getElementById('dateOfBirth').value,
      consentDate: document.getElementById('consentDate').value,
      consentGiven: document.getElementById('consentGiven').checked,
      signature: signaturePad.toDataURL('image/jpeg', 0.5),
      submissionDate: new Date().toLocaleString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      })
    };
  }

  // ============================================
  // UPLOAD FUNCTIONS
  // ============================================
  async function uploadSignatureToSupabase(signatureDataUrl, firstName, lastName) {
    const response = await fetch(signatureDataUrl);
    const blob = await response.blob();

    const timestamp = Date.now();
    const fileName = `signatures/${firstName}-${lastName}-${timestamp}.jpg`;
    
    const { data, error } = await supabaseClient.storage
      .from('medical-documents')
      .upload(fileName, blob, { contentType: 'image/jpeg', upsert: false });
    
    if (error) throw new Error('Failed to upload signature: ' + error.message);
    
    const { data: urlData } = supabaseClient.storage
      .from('medical-documents')
      .getPublicUrl(fileName);
    
    return urlData.publicUrl;
  }

  async function uploadPDFToSupabase(pdfBlob, firstName, lastName) {
    const timestamp = Date.now();
    const fileName = `consents/weight-loss-consent-${firstName}-${lastName}-${timestamp}.pdf`;
    
    const { data, error } = await supabaseClient.storage
      .from('medical-documents')
      .upload(fileName, pdfBlob, { contentType: 'application/pdf', upsert: false });
    
    if (error) throw new Error('Failed to upload PDF: ' + error.message);
    
    const { data: urlData } = supabaseClient.storage
      .from('medical-documents')
      .getPublicUrl(fileName);
    
    return urlData.publicUrl;
  }

  // ============================================
  // SAVE TO DATABASE
  // ============================================
  async function saveToDatabase(formData, signatureUrl, pdfUrl) {
    const payload = {
      consentType: CONFIG.consentType,
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      dateOfBirth: formData.dateOfBirth,
      consentDate: formData.consentDate,
      signatureUrl: signatureUrl,
      pdfUrl: pdfUrl,
      consentGiven: formData.consentGiven,
      ghlContactId: ghlContactId
    };

    const response = await fetch(CONFIG.api.consents, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    return await response.json();
  }

  // ============================================
  // SEND TO GHL
  // ============================================
  async function sendToGHL(formData, signatureUrl, pdfUrl) {
    const payload = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      dateOfBirth: formData.dateOfBirth,
      consentType: CONFIG.consentType,
      consentDate: formData.consentDate,
      customFieldKey: CONFIG.ghl.customFieldKey,
      customFieldValue: 'Complete',
      tags: CONFIG.ghl.tags,
      signatureUrl: signatureUrl,
      pdfUrl: pdfUrl
    };
    
    const response = await fetch(CONFIG.api.ghl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    return await response.json();
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

    function addBullet(text) {
      checkPageBreak(8);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      var lines = doc.splitTextToSize('• ' + text, contentWidth - 5);
      doc.text(lines, leftMargin + 3, yPos);
      yPos += lines.length * 3.8 + 1;
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
    doc.text('Compounded Weight Management Program — Informed Consent', leftMargin, 16);
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

    // ========== PURPOSE OF TREATMENT ==========
    addSectionHeader('Purpose of Treatment');
    addText('What is Compounded Weight Management Therapy?', 9, true);
    addText('This treatment is designed to support healthy, sustainable weight loss in conjunction with diet and lifestyle modifications. Your provider may prescribe compounded medications from a licensed compounding pharmacy to help:', 8.5);
    addBullet('Decrease appetite and cravings');
    addBullet('Improve metabolism and blood sugar balance');
    addBullet('Enhance satiety and reduce overeating');
    addBullet('Support fat loss and overall metabolic health');
    yPos += 1;
    addText('This therapy is administered by subcutaneous injection (under the skin), typically once per week, and is most effective when combined with a balanced, high-protein diet, consistent physical activity, adequate hydration and sleep. Potential benefits may include improvements in body composition, blood sugar regulation, energy, and cardiovascular health.', 8.5);
    yPos += 2;

    // ========== WHAT TO EXPECT ==========
    addSectionHeader('What to Expect');
    addText('Initial Consultation & Screening:', 9, true);
    addText('Your treatment begins with a consultation to review your medical and medication history, determine your eligibility for treatment, order lab work to assess key health markers, and record your baseline weight and metabolic profile.', 8.5);
    yPos += 1;
    addText('Injection Administration & Dosage Adjustments:', 9, true);
    addText('Your first injection may be administered in-office to monitor your response. You will typically receive 4 pre-filled syringes per month for self-administration, or you may choose weekly in-office injections. Dosage will be titrated gradually based on your individual response and tolerance.', 8.5);
    yPos += 1;
    addText('Weight Loss Expectations:', 9, true);
    addText('Results vary based on consistency, lifestyle, and adherence to your plan. Noticeable weight loss may take several weeks to months. This therapy is not a permanent solution; maintaining results requires long-term nutrition and lifestyle habits.', 8.5);
    yPos += 2;

    // ========== DIET & LIFESTYLE ==========
    addSectionHeader('Diet & Lifestyle Recommendations');
    addBullet('Eat a high-fiber diet with fruits and vegetables');
    addBullet('Consume small, protein-rich meals to promote satiety');
    addBullet('Avoid high-fat or spicy foods to minimize digestive discomfort');
    addBullet('Limit alcohol intake, as it may affect blood pressure and hydration');
    addBullet('Drink at least 40 oz of water daily to prevent dehydration and constipation');
    yPos += 2;

    // ========== SIDE EFFECTS ==========
    addSectionHeader('Possible Side Effects');
    addText('Common Side Effects (often improve with time):', 9, true);
    addBullet('Nausea');
    addBullet('Constipation');
    addBullet('Diarrhea');
    addBullet('Indigestion');
    addBullet('Abdominal discomfort');
    addBullet('Fatigue or dizziness');
    yPos += 2;

    // ========== SERIOUS RISKS ==========
    addSectionHeader('Serious Risks — Seek Immediate Medical Attention');
    addText('Stop the medication and seek urgent medical care if you experience:', 8.5);
    addBullet('Severe allergic reaction (rash, swelling of face/tongue/throat, difficulty breathing)');
    addBullet('Severe abdominal pain, nausea, or vomiting');
    addBullet('Signs of low blood sugar (sweating, shakiness, confusion, blurred vision)');
    addBullet('Persistent upper-right abdominal pain or yellowing of the skin/eyes');
    yPos += 2;

    // ========== CONTRAINDICATIONS ==========
    addSectionHeader('Contraindications');
    addText('This program may not be appropriate if you:', 8.5);
    addBullet('Are currently using another weight-management or appetite-suppressing medication');
    addBullet('Are pregnant, planning pregnancy (must stop 2 months prior), or breastfeeding');
    addBullet('Have a history of endocrine or metabolic disorders requiring specialist oversight');
    addBullet('Have had an allergic reaction to any ingredients in compounded weight-loss medications');
    yPos += 1;
    addText('Use with caution if you have:', 9, true);
    addBullet('A history of pancreatitis, kidney disease, or gallbladder issues');
    addBullet('Type 1 or Type 2 diabetes, or are taking insulin or sulfonylureas');
    addBullet('Depression, anxiety, or a history of suicidal thoughts');
    yPos += 2;

    // ========== LONG-TERM USE ==========
    addSectionHeader('Long-Term Use & Maintenance');
    addText('Some patients may reduce or discontinue therapy under medical supervision. Maintenance doses may help stabilize weight long term. Stopping therapy abruptly may lead to weight regain if healthy habits are not continued.', 8.5);
    yPos += 2;

    // ========== FINANCIAL AGREEMENT ==========
    addSectionHeader('Financial Agreement');
    addText('I understand that:', 9, true);
    addBullet('Compounded weight-management treatments are not covered by insurance and are self-pay');
    addBullet('There are no refunds once treatment begins');
    addBullet('Results vary and are not guaranteed');
    addBullet('I agree not to dispute or reverse payments. If a chargeback is initiated, I am responsible for collection, court, and legal fees');
    addBullet('Prices may change, and I agree to pay the rates in effect at the time of treatment');
    yPos += 4;

    // ========== CONSENT ACKNOWLEDGMENT ==========
    addSectionHeader('Consent Acknowledgment');
    addText('I acknowledge and consent: I have disclosed all relevant medical information, medications, and allergies. I have read and understand the potential benefits, risks, and expectations of treatment. All my questions have been answered to my satisfaction. I consent to participate in the Range Medical Compounded Weight Management Program under medical supervision. I release Range Medical, its providers, and staff from any liability except in cases of gross negligence or misconduct.', 8.5, true);
    yPos += 4;

    // ========== PATIENT SIGNATURE ==========
    addSectionHeader('Patient Signature');
    addText('By affixing my signature below, I certify that I have read this consent form in its entirety, that all of my questions have been answered to my satisfaction, and that I voluntarily consent to the Compounded Weight Management Program at Range Medical.', 8.5);
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
      doc.text('CONFIDENTIAL — Weight Management Consent', pageWidth / 2, pageHeight - 4, { align: 'center' });
    }

    return doc.output('blob');
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
    document.getElementById('consentContainer').innerHTML = `
      <div class="thank-you-page">
        <div class="thank-you-icon">✓</div>
        <h1>Welcome to the Program, ${formData.firstName}!</h1>
        <p class="thank-you-subtitle">Your consent form has been successfully submitted.</p>
        <div class="thank-you-details">
          <p>Thank you for enrolling in the Range Medical Compounded Weight Management Program.</p>
          <p>Our team will review your consent and contact you to schedule your initial consultation and lab work.</p>
          <p><strong>Important:</strong> Please follow all diet and lifestyle recommendations for best results.</p>
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
    showStatus('Submitting your consent form...', 'loading');
    
    try {
      const formData = collectFormData();
      const patientName = `${formData.firstName} ${formData.lastName}`;
      
      showStatus('Uploading signature...', 'loading');
      const signatureUrl = await uploadSignatureToSupabase(formData.signature, formData.firstName, formData.lastName);

      showStatus('Generating PDF...', 'loading');
      const pdfBlob = generatePDF(formData);

      showStatus('Uploading PDF...', 'loading');
      const pdfUrl = await uploadPDFToSupabase(pdfBlob, formData.firstName, formData.lastName);
      
      showStatus('Saving to database...', 'loading');
      try {
        await saveToDatabase(formData, signatureUrl, pdfUrl);
      } catch (dbError) {
        console.error('Database save failed:', dbError);
      }
      
      showStatus('Updating patient record...', 'loading');
      try {
        await sendToGHL(formData, signatureUrl, pdfUrl);
      } catch (ghlError) {
        console.error('GHL update failed:', ghlError);
      }
      
      showThankYouPage(formData);
      
    } catch (error) {
      console.error('Error:', error);
      showStatus('Error: ' + error.message, 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Consent Form';
    }
  });
}
