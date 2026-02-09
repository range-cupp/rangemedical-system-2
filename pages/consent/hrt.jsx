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
        .consent-text ol{margin-left:1.5rem;margin-bottom:1rem}
        .consent-text li{margin-bottom:1rem;color:var(--gray-800);padding-left:.5rem}
        .consent-text li:last-child{margin-bottom:0}
        .consent-text strong{font-weight:600}
        .checkbox-consent{display:flex;align-items:flex-start;gap:.75rem;margin-bottom:1.5rem;padding:1rem;background:var(--gray-50);border:1.5px solid var(--gray-300)}
        .checkbox-consent input[type="checkbox"]{width:1.5rem;height:1.5rem;margin-top:.25rem;cursor:pointer;accent-color:var(--black);flex-shrink:0}
        .checkbox-consent label{font-size:.9375rem;font-weight:500;text-transform:none;letter-spacing:normal;margin-bottom:0;cursor:pointer;color:var(--gray-900);line-height:1.6}
        .checkbox-consent.error{border-color:var(--error);background:#fef2f2}
        .signature-wrapper{margin-bottom:1.5rem}
        .signature-label{font-size:.8125rem;font-weight:600;text-transform:uppercase;letter-spacing:.05em;margin-bottom:.75rem;color:var(--gray-700);display:block}
        .signature-pad-container{border:2px solid var(--gray-300);background:var(--white);position:relative;margin-bottom:.75rem}
        .signature-pad-container.error{border-color:var(--error)}
        #signaturePad{display:block;width:100%;height:200px;cursor:crosshair;touch-action:none}
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
          <h2 className="form-title">Hormone Replacement Therapy Consent</h2>
          <p>Please read carefully and provide your consent</p>
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
            
            {/* Consent Information */}
            <div className="section">
              <h3 className="section-title">Patient Acknowledgments & Consent</h3>
              
              <div className="consent-text">
                <h4>Understanding of Treatment</h4>
                <ol>
                  <li><strong>Treatment Benefits and Risks:</strong> I understand that along with the benefits of hormone replacement therapy and any medical treatments provided by Range Medical, there are both risks and potential complications to treatment, as well as risks associated with not receiving treatment. These risks and potential complications have been clearly explained to me. I have not been promised or guaranteed any specific results from these therapies, and I agree to comply with the recommended treatment dosages and protocols.</li>
                  
                  <li><strong>Ongoing Monitoring and Testing:</strong> I agree to comply with ongoing testing and evaluations necessary to monitor my treatment progress and safety. These evaluations may include laboratory tests or other diagnostic procedures as recommended by my treating physician, primary care physician, or other specialists. I agree to maintain regular check-ups and preventive screenings, which may include complete physical examinations, EKGs, mammograms, pelvic and breast examinations, pap smears, prostate exams, PSA tests, colonoscopies, and any other medically appropriate examinations.</li>
                  
                  <li><strong>Reporting Adverse Events:</strong> I agree to immediately report any adverse reactions, side effects, or complications potentially related to my therapy to Range Medical. I acknowledge that the benefits, risks, and potential complications of treatments provided by Range Medical have been fully explained to me. I confirm that I have received all necessary information, have had all my questions answered to my satisfaction, and understand that no guarantees or promises regarding treatment outcomes have been made.</li>
                  
                  <li><strong>Financial Responsibility:</strong> I acknowledge that insurance providers may not cover physician evaluations, laboratory testing, medications, or therapies provided by Range Medical. I agree to assume full financial responsibility for all charges associated with these services, understanding that reimbursement from my insurance provider is not guaranteed and that payment is my sole responsibility regardless of insurance coverage.</li>
                  
                  <li><strong>Informed Consent Certification:</strong> I certify that I have read (or have had read to me) this entire consent form in its entirety. I have been educated about the benefits, risks, and potential complications associated with hormone replacement therapy and other treatments offered by Range Medical. All my questions have been answered to my complete satisfaction, and I freely and voluntarily consent to treatment without coercion or undue influence.</li>
                </ol>
              </div>
              
              <div className="checkbox-consent" id="consentCheckbox">
                <input type="checkbox" id="consentGiven" name="consentGiven" required />
                <label htmlFor="consentGiven">
                  <strong>I acknowledge and consent:</strong> I have read and fully understand the above patient acknowledgments. I consent to participate in hormone replacement therapy under the clinical supervision of the medical team at Range Medical. I understand my rights, responsibilities, and the nature of the treatment I am receiving.
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
                By signing above, I certify that I am the patient (or authorized representative) and that the information provided is accurate. My signature indicates my voluntary consent to hormone replacement therapy at Range Medical.
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
    consentType: 'hrt',
    consentTitle: 'HRT Consent',
    supabase: {
      url: 'https://teivfptpozltpqwahgdl.supabase.co',
      anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlaXZmcHRwb3psdHBxd2FoZ2RsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3MTMxNDksImV4cCI6MjA4MDI4OTE0OX0.NrI1AykMBOh91mM9BFvpSH0JwzGrkv5ADDkZinh0elc'
    },
    api: {
      consents: '/api/consent-forms',
      ghl: '/api/consent-to-ghl'
    },
    ghl: {
      customFieldKey: 'hrt_consent',
      customFieldValue: 'Complete',
      tags: ['hrt-consent-signed', 'consent-completed']
    },
    recipientEmail: 'cupp@range-medical.com, intake@range-medical.com'
  };

  // ============================================
  // SUPABASE CLIENT
  // ============================================
  const supabaseClient = window.supabase.createClient(CONFIG.supabase.url, CONFIG.supabase.anonKey);

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
    
    // Validate DOB separately
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
    
    const consentCheckbox = document.getElementById('consentGiven');
    if (!consentCheckbox.checked) {
      document.getElementById('consentCheckbox').classList.add('error');
      document.getElementById('consentError').classList.add('visible');
      isValid = false;
    }
    
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
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let yPos = margin;
    
    // Header
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('RANGE MEDICAL', pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('Hormone Replacement Therapy Consent', pageWidth / 2, yPos, { align: 'center' });
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
    
    // New page for consent
    doc.addPage();
    yPos = margin;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('PATIENT ACKNOWLEDGMENTS & CONSENT', margin, yPos);
    
    yPos += 12;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('1. Treatment Benefits and Risks', margin, yPos);
    yPos += 6;
    doc.setFont('helvetica', 'normal');
    const stmt1 = 'I understand that along with the benefits of hormone replacement therapy and any medical treatments provided by Range Medical, there are both risks and potential complications to treatment, as well as risks associated with not receiving treatment. These risks and potential complications have been clearly explained to me.';
    const stmt1Lines = doc.splitTextToSize(stmt1, pageWidth - 2 * margin);
    doc.text(stmt1Lines, margin, yPos);
    yPos += stmt1Lines.length * 5 + 8;
    
    doc.setFont('helvetica', 'bold');
    doc.text('2. Ongoing Monitoring and Testing', margin, yPos);
    yPos += 6;
    doc.setFont('helvetica', 'normal');
    const stmt2 = 'I agree to comply with ongoing testing and evaluations necessary to monitor my treatment progress and safety. These evaluations may include laboratory tests or other diagnostic procedures as recommended by my treating physician.';
    const stmt2Lines = doc.splitTextToSize(stmt2, pageWidth - 2 * margin);
    doc.text(stmt2Lines, margin, yPos);
    yPos += stmt2Lines.length * 5 + 8;
    
    doc.setFont('helvetica', 'bold');
    doc.text('3. Reporting Adverse Events', margin, yPos);
    yPos += 6;
    doc.setFont('helvetica', 'normal');
    const stmt3 = 'I agree to immediately report any adverse reactions, side effects, or complications potentially related to my therapy to Range Medical.';
    const stmt3Lines = doc.splitTextToSize(stmt3, pageWidth - 2 * margin);
    doc.text(stmt3Lines, margin, yPos);
    yPos += stmt3Lines.length * 5 + 8;
    
    doc.setFont('helvetica', 'bold');
    doc.text('4. Financial Responsibility', margin, yPos);
    yPos += 6;
    doc.setFont('helvetica', 'normal');
    const stmt4 = 'I acknowledge that insurance providers may not cover physician evaluations, laboratory testing, medications, or therapies provided by Range Medical. I agree to assume full financial responsibility for all charges.';
    const stmt4Lines = doc.splitTextToSize(stmt4, pageWidth - 2 * margin);
    doc.text(stmt4Lines, margin, yPos);
    yPos += stmt4Lines.length * 5 + 8;
    
    doc.setFont('helvetica', 'bold');
    doc.text('5. Informed Consent Certification', margin, yPos);
    yPos += 6;
    doc.setFont('helvetica', 'normal');
    const stmt5 = 'I certify that I have read this entire consent form. I have been educated about the benefits, risks, and potential complications associated with hormone replacement therapy. All my questions have been answered to my complete satisfaction.';
    const stmt5Lines = doc.splitTextToSize(stmt5, pageWidth - 2 * margin);
    doc.text(stmt5Lines, margin, yPos);
    yPos += stmt5Lines.length * 5 + 10;
    
    if (yPos > pageHeight - 70) {
      doc.addPage();
      yPos = margin;
    }
    
    // Consent Statement
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    const consentStatement = 'I have read and fully understand the above patient acknowledgments. I consent to participate in hormone replacement therapy under the clinical supervision of the medical team at Range Medical.';
    const consentLines = doc.splitTextToSize(consentStatement, pageWidth - 2 * margin);
    doc.text(consentLines, margin, yPos);
    yPos += consentLines.length * 5 + 10;
    
    // Signature
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
          pdfUrl: urls.pdfUrl
        })
      });
      return await response.json();
    } catch (error) {
      console.error('Error saving to database:', error);
      return { success: false, error: error.message };
    }
  }

  // ============================================
  // SEND TO GOHIGHLEVEL
  // ============================================
  async function sendToGoHighLevel(formData, urls) {
    try {
      const response = await fetch(CONFIG.api.ghl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          dateOfBirth: formData.dateOfBirth,
          consentType: CONFIG.consentType,
          consentDate: formData.consentDate,
          customFieldKey: CONFIG.ghl.customFieldKey,
          customFieldValue: CONFIG.ghl.customFieldValue,
          tags: CONFIG.ghl.tags,
          pdfUrl: urls.pdfUrl,
          signatureUrl: urls.signatureUrl
        })
      });
      return await response.json();
    } catch (error) {
      console.error('Error sending to GHL:', error);
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
      showStatus('Please complete all required fields.', 'error');
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
      
      showStatus('Updating patient record...', 'loading');
      await sendToGoHighLevel(formData, urls);
      
      showThankYouPage(formData);
      
    } catch (error) {
      console.error('Submission error:', error);
      showStatus('Error: ' + (error.message || 'Unknown error'), 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Consent Form';
    }
  });
}
