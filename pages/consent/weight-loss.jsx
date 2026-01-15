import Head from 'next/head';
import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

export default function WeightLossConsent() {
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
        <title>Weight Management Program Consent | Range Medical</title>
        <meta name="description" content="Compounded weight management program consent form for Range Medical." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex, nofollow" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <Script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js" onLoad={handleScriptLoad} />
      <Script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js" onLoad={handleScriptLoad} />
      <Script src="https://cdn.jsdelivr.net/npm/signature_pad@4.1.7/dist/signature_pad.umd.min.js" onLoad={handleScriptLoad} />
      <Script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2" onLoad={handleScriptLoad} />

      <style jsx global>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        :root{--black:#000;--white:#fff;--gray-50:#fafafa;--gray-100:#f5f5f5;--gray-200:#e5e5e5;--gray-300:#d4d4d4;--gray-400:#a3a3a3;--gray-500:#737373;--gray-600:#525252;--gray-700:#404040;--gray-800:#262626;--gray-900:#171717;--error:#dc2626;--success:#16a34a}
        html{font-size:16px}
        body{font-family:'DM Sans',-apple-system,BlinkMacSystemFont,sans-serif;background-color:var(--gray-100);color:var(--gray-900);line-height:1.6;min-height:100vh}
        .consent-container{max-width:800px;margin:0 auto;padding:2rem 1.5rem}
        .consent-header{text-align:center;margin-bottom:2.5rem;padding-bottom:2rem;border-bottom:2px solid var(--black)}
        .clinic-name{font-size:2.5rem;font-weight:700;letter-spacing:.15em;margin-bottom:.5rem;color:var(--black)}
        .form-title{font-size:1.25rem;font-weight:600;letter-spacing:.05em;text-transform:uppercase;margin-top:.5rem;color:var(--gray-700)}
        .consent-header p{color:var(--gray-600);font-size:.875rem;margin-top:.5rem}
        .form-container{background:var(--white);border:2px solid var(--black);padding:2rem}
        .section{margin-bottom:2.5rem;padding-bottom:2rem;border-bottom:1px solid var(--gray-200)}
        .section:last-of-type{border-bottom:none;margin-bottom:0;padding-bottom:0}
        .section-title{font-size:1.125rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;margin-bottom:1.5rem;padding-bottom:.75rem;border-bottom:2px solid var(--black);display:inline-block}
        .form-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1.25rem;margin-bottom:1.25rem}
        .form-row:last-child{margin-bottom:0}
        .form-group{display:flex;flex-direction:column}
        .form-group.full-width{grid-column:1/-1}
        .consent-container label{font-size:.8125rem;font-weight:600;text-transform:uppercase;letter-spacing:.05em;margin-bottom:.5rem;color:var(--gray-700)}
        .consent-container label .required{color:var(--error);margin-left:2px}
        .consent-container input[type="text"],.consent-container input[type="email"],.consent-container input[type="tel"],.consent-container input[type="date"],.consent-container select,.consent-container textarea{width:100%;padding:.75rem 1rem;font-size:1rem;font-family:inherit;border:1.5px solid var(--gray-300);background:var(--white);color:var(--gray-900);transition:border-color .2s ease,box-shadow .2s ease;border-radius:0}
        .consent-container input:focus,.consent-container select:focus,.consent-container textarea:focus{outline:none;border-color:var(--black);box-shadow:0 0 0 3px rgba(0,0,0,.1)}
        .consent-container input.error,.consent-container select.error,.consent-container textarea.error{border-color:var(--error)}
        .consent-text{background:var(--gray-50);border:1.5px solid var(--gray-300);padding:1.5rem;margin-bottom:1.5rem;line-height:1.8}
        .consent-text h4{font-size:.9375rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em;margin-bottom:1rem;color:var(--gray-800)}
        .consent-text p{margin-bottom:1rem;color:var(--gray-800)}
        .consent-text p:last-child{margin-bottom:0}
        .consent-text ul{margin-left:1.5rem;margin-bottom:1rem}
        .consent-text li{margin-bottom:.5rem;color:var(--gray-800)}
        .consent-text strong{font-weight:600}
        .checkbox-consent{display:flex;align-items:flex-start;gap:.75rem;margin-bottom:1.5rem;padding:1rem;background:var(--gray-50);border:1.5px solid var(--gray-300)}
        .checkbox-consent input[type="checkbox"]{width:1.5rem;height:1.5rem;margin-top:.25rem;cursor:pointer;accent-color:var(--black);flex-shrink:0}
        .checkbox-consent label{font-size:.9375rem;font-weight:500;text-transform:none;letter-spacing:normal;margin-bottom:0;cursor:pointer;color:var(--gray-900);line-height:1.6}
        .checkbox-consent.error{border-color:var(--error);background:#fef2f2}
        .signature-wrapper{margin-bottom:1.5rem}
        .signature-label{font-size:.8125rem;font-weight:600;text-transform:uppercase;letter-spacing:.05em;margin-bottom:.75rem;color:var(--gray-700);display:block}
        .signature-pad-container{border:2px solid var(--gray-300);background:var(--white);position:relative;margin-bottom:.75rem}
        .signature-pad-container.error{border-color:var(--error)}
        #signaturePad{display:block;width:100%;height:200px;cursor:crosshair}
        .signature-placeholder{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:var(--gray-400);font-size:.875rem;pointer-events:none;text-align:center}
        .signature-controls{display:flex;gap:1rem}
        .btn-clear{padding:.625rem 1.25rem;font-size:.875rem;font-weight:600;text-transform:uppercase;letter-spacing:.05em;border:1.5px solid var(--gray-300);background:var(--white);color:var(--gray-700);cursor:pointer;transition:all .2s ease;font-family:inherit}
        .btn-clear:hover{border-color:var(--black);background:var(--gray-50)}
        .field-error{font-size:.8125rem;color:var(--error);margin-top:.5rem;display:none}
        .field-error.visible{display:block}
        .submit-section{margin-top:2rem;padding-top:2rem;border-top:2px solid var(--gray-200);text-align:center}
        .btn-submit{padding:1rem 3rem;font-size:1rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;border:2px solid var(--black);background:var(--black);color:var(--white);cursor:pointer;transition:all .2s ease;font-family:inherit;min-width:250px}
        .btn-submit:hover:not(:disabled){background:var(--white);color:var(--black)}
        .btn-submit:disabled{opacity:.6;cursor:not-allowed}
        .status-message{padding:1rem 1.5rem;margin-bottom:1.5rem;font-size:.9375rem;font-weight:500;text-align:center;display:none}
        .status-message.visible{display:block}
        .status-message.error{background:#fef2f2;color:var(--error);border:1.5px solid var(--error)}
        .status-message.success{background:#f0fdf4;color:var(--success);border:1.5px solid var(--success)}
        .status-message.loading{background:var(--gray-100);color:var(--gray-700);border:1.5px solid var(--gray-300)}
        .thank-you-page{background:var(--white);border:2px solid var(--black);padding:3rem 2rem;text-align:center}
        .thank-you-icon{width:80px;height:80px;background:var(--black);color:var(--white);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:3rem;margin:0 auto 2rem}
        .thank-you-page h1{font-size:2rem;font-weight:700;margin-bottom:1rem;color:var(--black)}
        .thank-you-subtitle{font-size:1.125rem;color:var(--gray-600);margin-bottom:2rem}
        .thank-you-details{padding:2rem;background:var(--gray-50);border:1.5px solid var(--gray-200);margin-bottom:2rem}
        .thank-you-details p{margin-bottom:.75rem;color:var(--gray-700)}
        .thank-you-details p:last-child{margin-bottom:0}
        .thank-you-contact{margin-bottom:2rem}
        .thank-you-contact h3{font-size:1rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em;margin-bottom:.5rem;color:var(--gray-800)}
        .thank-you-contact a{color:var(--black);text-decoration:underline}
        .thank-you-footer{padding-top:2rem;border-top:2px solid var(--gray-200)}
        .thank-you-footer p{font-size:1.5rem;font-weight:700;letter-spacing:.15em;color:var(--black)}
        @media(max-width:640px){.clinic-name{font-size:2rem}.form-container{padding:1.5rem}.form-row{grid-template-columns:1fr}}
      `}</style>

      <div className="consent-container" id="consentContainer">
        <div className="consent-header">
          <h1 className="clinic-name">RANGE MEDICAL</h1>
          <h2 className="form-title">Compounded Weight Management Program Consent</h2>
          <p>Please read carefully and provide your informed consent</p>
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
              <button type="submit" className="btn-submit" id="submitBtn">Submit Consent Form</button>
            </div>
          </form>
        </div>
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
    emailjs: {
      publicKey: 'ZeNFfwJ37Uhd6E1vp',
      serviceId: 'service_pyl6wra',
      templateId: 'template_67a68ws'
    },
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
    
    const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'consentDate'];
    requiredFields.forEach(fieldId => {
      const field = document.getElementById(fieldId);
      const error = document.getElementById(fieldId + 'Error');
      if (!field.value.trim()) {
        field.classList.add('error');
        if (error) error.classList.add('visible');
        isValid = false;
      } else {
        field.classList.remove('error');
        if (error) error.classList.remove('visible');
      }
    });
    
    // Validate DOB
    const dob = document.getElementById('dateOfBirth');
    const dobError = document.getElementById('dateOfBirthError');
    if (!dob.value.trim() || !isValidDOB(dob.value)) {
      dob.classList.add('error');
      if (dobError) dobError.classList.add('visible');
      isValid = false;
    } else {
      dob.classList.remove('error');
      if (dobError) dobError.classList.remove('visible');
    }
    
    // Validate consent
    const consentCheckbox = document.getElementById('consentGiven');
    if (!consentCheckbox.checked) {
      document.getElementById('consentCheckbox').classList.add('error');
      document.getElementById('consentError').classList.add('visible');
      isValid = false;
    }
    
    // Validate signature
    if (signaturePad.isEmpty()) {
      document.getElementById('signatureContainer').classList.add('error');
      document.getElementById('signatureError').classList.add('visible');
      isValid = false;
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
  async function uploadSignatureToSupabase(signatureDataUrl, patientName) {
    const response = await fetch(signatureDataUrl);
    const blob = await response.blob();
    
    const timestamp = Date.now();
    const safeName = patientName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const fileName = `signatures/weight-loss-consent/${safeName}-${timestamp}.jpg`;
    
    const { data, error } = await supabaseClient.storage
      .from('medical-documents')
      .upload(fileName, blob, { contentType: 'image/jpeg', upsert: false });
    
    if (error) throw new Error('Failed to upload signature: ' + error.message);
    
    const { data: urlData } = supabaseClient.storage
      .from('medical-documents')
      .getPublicUrl(fileName);
    
    return urlData.publicUrl;
  }

  async function uploadPDFToSupabase(pdfBlob, patientName) {
    const timestamp = Date.now();
    const safeName = patientName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const fileName = `consents/weight-loss-consent/${safeName}-${timestamp}.pdf`;
    
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
      consentGiven: formData.consentGiven
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
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let yPos = margin;
    
    // Header
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('RANGE MEDICAL', pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Compounded Weight Management Program Consent', pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    
    // Patient Info
    yPos += 15;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('PATIENT INFORMATION', margin, yPos);
    yPos += 10;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(`Name: ${formData.firstName} ${formData.lastName}`, margin, yPos);
    yPos += 8;
    doc.text(`Email: ${formData.email}`, margin, yPos);
    yPos += 8;
    doc.text(`Phone: ${formData.phone}`, margin, yPos);
    yPos += 8;
    doc.text(`Date of Birth: ${formData.dateOfBirth}`, margin, yPos);
    yPos += 8;
    doc.text(`Date: ${formData.consentDate}`, margin, yPos);
    
    // New page for consent content
    doc.addPage();
    yPos = margin;
    
    const sections = [
      {
        title: 'PURPOSE OF TREATMENT',
        text: 'Compounded weight management therapy is designed to support healthy, sustainable weight loss in conjunction with diet and lifestyle modifications. Medications may help decrease appetite and cravings, improve metabolism and blood sugar balance, enhance satiety, and support fat loss. Therapy is administered by subcutaneous injection, typically once per week, and is most effective when combined with a balanced diet, physical activity, hydration, and sleep.'
      },
      {
        title: 'WHAT TO EXPECT',
        text: 'Treatment begins with a consultation to review medical history, determine eligibility, and order lab work. Your first injection may be administered in-office. You will typically receive 4 pre-filled syringes per month for self-administration or may choose weekly in-office injections. Dosage will be adjusted gradually. Results vary based on consistency and lifestyle. Noticeable weight loss may take several weeks to months. This is not a permanent solution; maintaining results requires long-term lifestyle habits.'
      },
      {
        title: 'DIET & LIFESTYLE RECOMMENDATIONS',
        text: 'Eat a high-fiber diet with fruits and vegetables. Consume small, protein-rich meals. Avoid high-fat or spicy foods. Limit alcohol intake. Drink at least 40 oz of water daily to prevent dehydration and constipation.'
      },
      {
        title: 'COMMON SIDE EFFECTS',
        text: 'Nausea, constipation, diarrhea, indigestion, abdominal discomfort, fatigue, or dizziness. These often improve with time.'
      },
      {
        title: 'SERIOUS RISKS - SEEK IMMEDIATE CARE FOR:',
        text: 'Severe allergic reaction (rash, swelling, difficulty breathing), severe abdominal pain or vomiting, signs of low blood sugar (sweating, shakiness, confusion), or persistent upper-right abdominal pain or yellowing of skin/eyes.'
      },
      {
        title: 'CONTRAINDICATIONS',
        text: 'This program may not be appropriate if you are using other weight-management medications, are pregnant/planning pregnancy/breastfeeding, have endocrine or metabolic disorders, or have allergies to ingredients. Use with caution if you have pancreatitis, kidney disease, gallbladder issues, diabetes, or history of depression or suicidal thoughts.'
      },
      {
        title: 'FINANCIAL AGREEMENT',
        text: 'Compounded weight-management treatments are not covered by insurance and are self-pay. There are no refunds once treatment begins. Results vary and are not guaranteed. I agree not to dispute or reverse payments. If a chargeback is initiated, I am responsible for collection, court, and legal fees.'
      }
    ];
    
    sections.forEach(section => {
      if (yPos > pageHeight - 50) {
        doc.addPage();
        yPos = margin;
      }
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(section.title, margin, yPos);
      yPos += 6;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const lines = doc.splitTextToSize(section.text, pageWidth - 2 * margin);
      doc.text(lines, margin, yPos);
      yPos += lines.length * 4.5 + 8;
    });
    
    // Consent acknowledgment
    if (yPos > pageHeight - 60) {
      doc.addPage();
      yPos = margin;
    }
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('ACKNOWLEDGMENT AND CONSENT', margin, yPos);
    yPos += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const ackText = 'I have disclosed all relevant medical information, medications, and allergies. I have read and understand the potential benefits, risks, and expectations of treatment. All my questions have been answered to my satisfaction. I consent to participate in the Range Medical Compounded Weight Management Program under medical supervision. I release Range Medical, its providers, and staff from any liability except in cases of gross negligence or misconduct.';
    const ackLines = doc.splitTextToSize(ackText, pageWidth - 2 * margin);
    doc.text(ackLines, margin, yPos);
    yPos += ackLines.length * 4.5 + 10;
    
    // Signature
    if (yPos > pageHeight - 60) {
      doc.addPage();
      yPos = margin;
    }
    
    doc.setFont('helvetica', 'bold');
    doc.text('Patient Signature:', margin, yPos);
    if (formData.signature) {
      yPos += 5;
      doc.addImage(formData.signature, 'JPEG', margin, yPos, 60, 22);
      yPos += 27;
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Signed on: ${formData.consentDate}`, margin, yPos);
    
    // Footer
    yPos = pageHeight - 15;
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text('© 2025 Range Medical. All rights reserved. | Confidential Patient Information', pageWidth / 2, yPos, { align: 'center' });
    
    return doc.output('blob');
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
COMPOUNDED WEIGHT MANAGEMENT PROGRAM CONSENT
============================================

PATIENT INFORMATION
-------------------
Name: ${formData.firstName} ${formData.lastName}
Email: ${formData.email}
Phone: ${formData.phone}
Date of Birth: ${formData.dateOfBirth}
Date of Consent: ${formData.consentDate}

CONSENT
-------
Consent Given: ${formData.consentGiven ? 'Yes' : 'No'}
Signature: Provided electronically
Submitted: ${formData.submissionDate}

PROGRAM ACKNOWLEDGMENTS
-----------------------
Patient has acknowledged understanding of:
- Treatment purpose and administration
- Expected outcomes and timeline
- Diet and lifestyle requirements
- Common and serious side effects
- Contraindications and cautions
- Long-term maintenance needs
- Financial responsibility (self-pay, no refunds)

============================================
PDF consent form is attached to this email.
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
      filename: `RangeMedical_WeightManagementConsent_${formData.lastName}_${formData.firstName}.pdf`
    };
    
    return await window.emailjs.send(CONFIG.emailjs.serviceId, CONFIG.emailjs.templateId, templateParams);
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
      showStatus('Please complete all required fields.', 'error');
      const firstError = document.querySelector('.field-error.visible');
      if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
      const signatureUrl = await uploadSignatureToSupabase(formData.signature, patientName);
      
      showStatus('Generating PDF...', 'loading');
      const pdfBlob = generatePDF(formData);
      
      showStatus('Uploading PDF...', 'loading');
      const pdfUrl = await uploadPDFToSupabase(pdfBlob, patientName);
      
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
      
      showStatus('Sending to Range Medical...', 'loading');
      try {
        await sendEmail(formData, pdfBlob);
      } catch (emailError) {
        console.error('Email failed:', emailError);
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
