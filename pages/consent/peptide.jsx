import Head from 'next/head';
import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

export default function PeptideConsent() {
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
        <title>Peptide Therapy Consent | Range Medical</title>
        <meta name="description" content="Peptide therapy consent form for Range Medical." />
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
        .consent-text strong{font-weight:600}
        .checkbox-consent{display:flex;align-items:flex-start;gap:.75rem;margin-bottom:1.5rem;padding:1rem;background:var(--gray-50);border:1.5px solid var(--gray-300)}
        .checkbox-consent input[type="checkbox"]{width:1.5rem;height:1.5rem;margin-top:.25rem;cursor:pointer;accent-color:var(--black);flex-shrink:0}
        .checkbox-consent label{font-size:.9375rem;font-weight:500;text-transform:none;letter-spacing:normal;margin-bottom:0;cursor:pointer;color:var(--gray-900);line-height:1.6}
        .checkbox-consent.error{border-color:var(--error);background:#fef2f2}
        .signature-container{border:1.5px solid var(--gray-300);background:var(--white)}
        .signature-container.error{border-color:var(--error)}
        .signature-pad{width:100%;height:150px;display:block}
        .signature-actions{display:flex;gap:1rem;margin-top:.75rem}
        .btn-clear{padding:.5rem 1rem;font-size:.875rem;font-weight:600;background:var(--white);border:1.5px solid var(--gray-400);cursor:pointer;transition:all .2s ease}
        .btn-clear:hover{border-color:var(--black);background:var(--gray-100)}
        .field-error{font-size:.8125rem;color:var(--error);margin-top:.375rem;display:none}
        .field-error.visible{display:block}
        .submit-section{margin-top:2.5rem;padding-top:2rem;border-top:2px solid var(--black)}
        .btn-submit{width:100%;padding:1.25rem 2rem;font-size:1.125rem;font-weight:700;font-family:inherit;text-transform:uppercase;letter-spacing:.1em;background:var(--black);color:var(--white);border:none;cursor:pointer;transition:all .2s ease}
        .btn-submit:hover{background:var(--gray-800);transform:translateY(-1px)}
        .btn-submit:disabled{background:var(--gray-400);cursor:not-allowed;transform:none}
        .status-message{padding:1rem;margin-top:1rem;text-align:center;font-weight:600;display:none}
        .status-message.visible{display:block}
        .status-message.success{background:#dcfce7;color:var(--success);border:1px solid var(--success)}
        .status-message.error{background:#fee2e2;color:var(--error);border:1px solid var(--error)}
        .status-message.loading{background:var(--gray-100);color:var(--gray-700);border:1px solid var(--gray-300)}
        .thank-you-page{background:var(--white);border:2px solid var(--black);padding:3rem 2rem;text-align:center;max-width:600px;margin:2rem auto}
        .thank-you-icon{width:80px;height:80px;background:var(--black);color:var(--white);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:2.5rem;margin:0 auto 1.5rem auto}
        .thank-you-page h1{font-size:2rem;font-weight:700;margin-bottom:.5rem;color:var(--black)}
        .thank-you-subtitle{font-size:1.125rem;color:var(--gray-600);margin-bottom:2rem}
        .thank-you-details{background:var(--gray-50);padding:1.5rem;margin-bottom:2rem;border-left:4px solid var(--black);text-align:left}
        .thank-you-details p{margin-bottom:.75rem;color:var(--gray-700)}
        .thank-you-details p:last-child{margin-bottom:0}
        .thank-you-footer{padding-top:1.5rem;border-top:1px solid var(--gray-200)}
        .thank-you-footer p{font-size:1.25rem;font-weight:700;letter-spacing:.1em;color:var(--black)}
        @media(max-width:600px){.consent-container{padding:1rem}.form-container{padding:1.5rem}.form-row{grid-template-columns:1fr}.clinic-name{font-size:2rem}}
      `}</style>

      <div className="consent-container" id="consentContainer">
        <header className="consent-header">
          <h1 className="clinic-name">RANGE MEDICAL</h1>
          <h2 className="form-title">Peptide Therapy & Injection Consent</h2>
          <p>Please read carefully and provide your consent</p>
        </header>
        
        <div className="form-container">
          <form id="consentForm" noValidate>
            {/* Patient Information */}
            <div className="section">
              <h3 className="section-title">Patient Information</h3>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName">First Name <span className="required">*</span></label>
                  <input type="text" id="firstName" name="firstName" required />
                  <span className="field-error" id="firstNameError">Please enter your first name</span>
                </div>
                <div className="form-group">
                  <label htmlFor="lastName">Last Name <span className="required">*</span></label>
                  <input type="text" id="lastName" name="lastName" required />
                  <span className="field-error" id="lastNameError">Please enter your last name</span>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="email">Email <span className="required">*</span></label>
                  <input type="email" id="email" name="email" required />
                  <span className="field-error" id="emailError">Please enter a valid email</span>
                </div>
                <div className="form-group">
                  <label htmlFor="phone">Phone <span className="required">*</span></label>
                  <input type="tel" id="phone" name="phone" required />
                  <span className="field-error" id="phoneError">Please enter your phone number</span>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="dateOfBirth">Date of Birth <span className="required">*</span></label>
                  <input type="text" id="dateOfBirth" name="dateOfBirth" placeholder="MM/DD/YYYY" maxLength="10" required />
                  <span className="field-error" id="dateOfBirthError">Please enter a valid date (MM/DD/YYYY)</span>
                </div>
                <div className="form-group">
                  <label htmlFor="consentDate">Today's Date <span className="required">*</span></label>
                  <input type="date" id="consentDate" name="consentDate" required />
                  <span className="field-error" id="consentDateError">Please enter today's date</span>
                </div>
              </div>
            </div>
            
            {/* Consent Information */}
            <div className="section">
              <h3 className="section-title">Peptide Therapy & Injection Consent</h3>
              
              <div className="consent-text">
                <h4>Treatment Overview</h4>
                <p>This consent covers peptide therapy, outlining potential benefits, risks, and your rights as a patient.</p>
                <p>Peptides are short amino acid chains that may support functions such as cellular repair, immune enhancement, and vitality. Many peptides are considered research compounds and may not be FDA-approved for all uses.</p>
                
                <h4>Potential Benefits</h4>
                <p><strong>Results vary and are not guaranteed.</strong></p>
                <p>Possible benefits may include: cellular repair, improved immune function, increased energy, improved sleep, enhanced recovery, metabolic support, and potential anti-aging effects.</p>
                
                <h4>Risks and Side Effects</h4>
                <p><strong>Common:</strong> Injection site reactions, headache, water retention, joint pain, flushing, fatigue, nausea.</p>
                <p><strong>Less Common:</strong> Allergic reactions, changes in heart rate, numbness, dizziness, blood sugar fluctuations, gastrointestinal issues, mood changes.</p>
                <p><strong>Rare but Serious:</strong> Severe allergic reactions, significant blood pressure changes, abnormal tissue growth, hormonal imbalances, unexpected interactions.</p>
                <p><strong>Long-Term Risks:</strong> Unknown; potential desensitization.</p>
                
                <h4>Alternatives</h4>
                <p>Alternatives to peptide therapy include conventional treatments, lifestyle modifications, nutritional supplements, hormone therapy, and other integrative approaches.</p>
                
                <h4>Storage and Administration Guidelines</h4>
                <p>Peptides must be stored according to instructions (typically refrigerated), reconstituted properly, administered correctly, and handled using sterile technique. Dosage and schedule should follow provider instructions.</p>
                
                <h4>Post-Treatment Expectations</h4>
                <p>Results may take time. Regular follow-up visits, protocol adjustments, and lab testing may be recommended. Peptide therapy is typically not covered by insurance; payment is due at time of service.</p>
                
                <h4>Terms and Conditions</h4>
                <p>No refunds or exchanges are offered, and results are not guaranteed. This therapy is elective and intended primarily for wellness optimization, not for diagnosing, treating, or curing a medical condition.</p>
                
                <h4>Informed Consent and Authorization for Treatment</h4>
                <p>I have had sufficient discussion with my provider about peptide therapy, including its risks, benefits, alternatives, and regulatory status. I have disclosed my complete medical history and understand my right to discontinue at any time, acknowledging that refunds will not be provided.</p>
              </div>
              
              <div className="checkbox-consent" id="consentCheckbox">
                <input type="checkbox" id="consentGiven" name="consentGiven" required />
                <label htmlFor="consentGiven">
                  <strong>I have read and understand the above information.</strong> I voluntarily consent to peptide injection therapy at Range Medical. I acknowledge that the procedure, risks, benefits, alternatives, and terms have been explained to me, and I accept full responsibility for my decision to proceed.
                </label>
              </div>
              <span className="field-error" id="consentError">You must provide consent to continue</span>
            </div>
            
            {/* Signature */}
            <div className="section">
              <h3 className="section-title">Patient Signature</h3>
              <div className="form-row">
                <div className="form-group full-width">
                  <label>Sign Below <span className="required">*</span></label>
                  <div className="signature-container" id="signatureContainer">
                    <canvas id="signaturePad" className="signature-pad"></canvas>
                  </div>
                  <div className="signature-actions">
                    <button type="button" className="btn-clear" id="clearSignature">Clear Signature</button>
                  </div>
                  <span className="field-error" id="signatureError">Please provide your signature</span>
                </div>
              </div>
              <p style={{ fontSize: '.875rem', color: 'var(--gray-600)', marginTop: '1rem' }}>By signing above, I certify that I am the patient (or authorized representative) and that the information provided is accurate.</p>
            </div>
            
            <div className="submit-section">
              <button type="submit" className="btn-submit" id="submitBtn">Submit Consent Form</button>
              <div className="status-message" id="statusMessage"></div>
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
      templateId: 'template_8im5mig'
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
      customFieldKey: 'peptide_consent',
      tags: ['peptide-consent-signed', 'consent-completed']
    },
    consentType: 'peptide',
    recipientEmail: 'cupp@range-medical.com, intake@range-medical.com'
  };

  // ============================================
  // SUPABASE CLIENT
  // ============================================
  const supabaseClient = window.supabase.createClient(CONFIG.supabase.url, CONFIG.supabase.anonKey);

  // ============================================
  // SIGNATURE PAD
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

  document.getElementById('clearSignature').addEventListener('click', function() {
    signaturePad.clear();
  });

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
  // SET DEFAULT DATE
  // ============================================
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('consentDate').value = today;

  // ============================================
  // FORM VALIDATION
  // ============================================
  function validateForm() {
    let isValid = true;
    
    const requiredFields = [
      { id: 'firstName', error: 'firstNameError' },
      { id: 'lastName', error: 'lastNameError' },
      { id: 'email', error: 'emailError' },
      { id: 'phone', error: 'phoneError' },
      { id: 'consentDate', error: 'consentDateError' }
    ];
    
    requiredFields.forEach(f => {
      const input = document.getElementById(f.id);
      const error = document.getElementById(f.error);
      if (!input.value.trim()) {
        input.classList.add('error');
        error.classList.add('visible');
        isValid = false;
      } else {
        input.classList.remove('error');
        error.classList.remove('visible');
      }
    });
    
    // Validate DOB
    const dob = document.getElementById('dateOfBirth');
    const dobError = document.getElementById('dateOfBirthError');
    if (!dob.value.trim() || !isValidDOB(dob.value)) {
      dob.classList.add('error');
      dobError.classList.add('visible');
      isValid = false;
    } else {
      dob.classList.remove('error');
      dobError.classList.remove('visible');
    }
    
    // Validate email format
    const email = document.getElementById('email');
    if (email.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
      email.classList.add('error');
      document.getElementById('emailError').classList.add('visible');
      isValid = false;
    }
    
    // Validate consent checkbox
    const consentCheckbox = document.getElementById('consentGiven');
    if (!consentCheckbox.checked) {
      document.getElementById('consentCheckbox').classList.add('error');
      document.getElementById('consentError').classList.add('visible');
      isValid = false;
    } else {
      document.getElementById('consentCheckbox').classList.remove('error');
      document.getElementById('consentError').classList.remove('visible');
    }
    
    // Validate signature
    if (signaturePad.isEmpty()) {
      document.getElementById('signatureContainer').classList.add('error');
      document.getElementById('signatureError').classList.add('visible');
      isValid = false;
    } else {
      document.getElementById('signatureContainer').classList.remove('error');
      document.getElementById('signatureError').classList.remove('visible');
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
      dateOfBirth: document.getElementById('dateOfBirth').value, // MM/DD/YYYY format
      consentDate: document.getElementById('consentDate').value,
      consentGiven: document.getElementById('consentGiven').checked,
      signature: signaturePad.toDataURL(),
      submissionDate: new Date().toLocaleString()
    };
  }

  // ============================================
  // UPLOAD SIGNATURE TO SUPABASE
  // ============================================
  async function uploadSignatureToSupabase(base64Data, patientName) {
    try {
      const timestamp = Date.now();
      const safeName = patientName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
      const fileName = `${safeName}-${timestamp}.png`;
      const filePath = `signatures/peptide-consent/${fileName}`;
      
      const base64Content = base64Data.split(',')[1];
      const mimeType = 'image/png';
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
      console.error('Error uploading signature:', error);
      throw error;
    }
  }

  // ============================================
  // UPLOAD PDF TO SUPABASE
  // ============================================
  async function uploadPDFToSupabase(pdfBlob, patientName) {
    try {
      const timestamp = Date.now();
      const safeName = patientName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
      const fileName = `${safeName}-${timestamp}.pdf`;
      const filePath = `consents/peptide-consent/${fileName}`;
      
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
    let yPos = 20;
    const leftMargin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const contentWidth = pageWidth - 40;
    
    function addText(text, fontSize = 10, isBold = false) {
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', isBold ? 'bold' : 'normal');
      const lines = doc.splitTextToSize(String(text || ''), contentWidth);
      doc.text(lines, leftMargin, yPos);
      yPos += (lines.length * fontSize * 0.4) + 2;
      if (yPos > 270) { doc.addPage(); yPos = 20; }
    }
    
    function addSection(text) {
      yPos += 5;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(text, leftMargin, yPos);
      yPos += 2;
      doc.setLineWidth(0.5);
      doc.line(leftMargin, yPos, pageWidth - leftMargin, yPos);
      yPos += 6;
    }
    
    // Header
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('RANGE MEDICAL', pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('Peptide Therapy & Injection Consent', pageWidth / 2, yPos, { align: 'center' });
    yPos += 6;
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('Submitted: ' + formData.submissionDate, pageWidth / 2, yPos, { align: 'center' });
    doc.setTextColor(0);
    yPos += 5;
    doc.setLineWidth(1);
    doc.line(leftMargin, yPos, pageWidth - leftMargin, yPos);
    yPos += 10;
    
    // Patient Info
    addSection('PATIENT INFORMATION');
    addText('Name: ' + formData.firstName + ' ' + formData.lastName);
    addText('Email: ' + formData.email);
    addText('Phone: ' + formData.phone);
    addText('Date of Birth: ' + formData.dateOfBirth);
    addText('Consent Date: ' + formData.consentDate);
    
    // Consent Content
    addSection('PEPTIDE THERAPY CONSENT');
    addText('Treatment Overview', 10, true);
    addText('This consent covers peptide therapy, outlining potential benefits, risks, and your rights as a patient. Peptides are short amino acid chains that may support functions such as cellular repair, immune enhancement, and vitality.');
    
    addText('Potential Benefits', 10, true);
    addText('Results vary and are not guaranteed. Possible benefits may include: cellular repair, improved immune function, increased energy, improved sleep, enhanced recovery, metabolic support, and potential anti-aging effects.');
    
    addText('Risks and Side Effects', 10, true);
    addText('Common: Injection site reactions, headache, water retention, joint pain, flushing, fatigue, nausea. Rare but Serious: Severe allergic reactions, blood pressure changes, abnormal tissue growth.');
    
    addText('Terms and Conditions', 10, true);
    addText('No refunds or exchanges are offered, and results are not guaranteed. This therapy is elective and intended primarily for wellness optimization.');
    
    // Consent Acknowledgment
    addSection('CONSENT ACKNOWLEDGMENT');
    addText('I have read and understand the above information. I voluntarily consent to peptide injection therapy at Range Medical.', 10, true);
    yPos += 5;
    addText('Consent Given: Yes');
    addText('Signature: Provided electronically');
    
    // Footer
    yPos = pageHeight - 15;
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text('© 2025 Range Medical | Confidential Patient Information', pageWidth / 2, yPos, { align: 'center' });
    
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
    
    const messageBody = `PEPTIDE THERAPY CONSENT FORM SUBMISSION
====================================================

PATIENT INFORMATION
-------------------
Name: ${formData.firstName} ${formData.lastName}
Email: ${formData.email}
Phone: ${formData.phone}
Date of Birth: ${formData.dateOfBirth}
Consent Date: ${formData.consentDate}

CONSENT
-------
Consent Given: Yes
Signature: Provided electronically
Submitted: ${formData.submissionDate}

====================================================
PDF consent form is attached to this email.`;
    
    const templateParams = {
      to_email: CONFIG.recipientEmail,
      from_name: `${formData.firstName} ${formData.lastName}`,
      patient_name: `${formData.firstName} ${formData.lastName}`,
      patient_email: formData.email,
      patient_phone: formData.phone,
      submission_date: formData.submissionDate,
      message: messageBody,
      content: base64PDF,
      filename: `RangeMedical_PeptideConsent_${formData.lastName}_${formData.firstName}.pdf`
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
        <h1>Thank You, ${formData.firstName}!</h1>
        <p class="thank-you-subtitle">Your consent form has been successfully submitted.</p>
        <div class="thank-you-details">
          <p>Your peptide therapy consent form has been received by Range Medical.</p>
          <p>Our team will review your consent before your treatment.</p>
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
      showStatus('Please fill in all required fields correctly.', 'error');
      const firstError = document.querySelector('.field-error.visible');
      if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
      const signatureUrl = await uploadSignatureToSupabase(formData.signature, patientName);
      
      showStatus('Generating PDF...', 'loading');
      const pdfBlob = generatePDF(formData);
      
      showStatus('Uploading PDF...', 'loading');
      const pdfUrl = await uploadPDFToSupabase(pdfBlob, patientName);
      
      showStatus('Sending to Range Medical...', 'loading');
      await sendEmail(formData, pdfBlob);
      
      showStatus('Saving to database...', 'loading');
      await saveToDatabase(formData, signatureUrl, pdfUrl);
      
      showStatus('Syncing to system...', 'loading');
      await sendToGHL(formData, signatureUrl, pdfUrl);
      
      showThankYouPage(formData);
      
    } catch (error) {
      console.error('Submission error:', error);
      showStatus('Error: ' + (error.message || 'Unknown error'), 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Consent Form';
    }
  });
}
