import Head from 'next/head';
import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

export default function BloodDrawConsent() {
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
        <title>Blood Draw Consent Form | Range Medical</title>
        <meta name="description" content="Blood draw consent form for Range Medical laboratory services." />
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
        .thank-you-footer{padding-top:2rem;border-top:2px solid var(--gray-200)}
        .thank-you-footer p{font-size:1.5rem;font-weight:700;letter-spacing:.15em;color:var(--black)}
        @media(max-width:640px){.clinic-name{font-size:2rem}.form-container{padding:1.5rem}.form-row{grid-template-columns:1fr}}
      `}</style>

      <div className="consent-container" id="consentContainer">
        <div className="consent-header">
          <h1 className="clinic-name">RANGE MEDICAL</h1>
          <h2 className="form-title">Blood Draw Consent Form</h2>
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
                  <input type="date" id="dateOfBirth" name="dateOfBirth" required />
                  <div className="field-error" id="dateOfBirthError">Please enter your date of birth</div>
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
              <h3 className="section-title">Consent for Blood Draw</h3>
              
              <div className="consent-text">
                <h4>Purpose</h4>
                <p>I understand that I am voluntarily ordering blood to be drawn from my vein for laboratory testing. I am obtaining these tests on my own initiative to discuss treatment options with Range Medical. These tests will provide information about my health status to support consultation and treatment planning.</p>
                
                <h4>Procedure</h4>
                <p>I understand that the blood draw procedure will involve:</p>
                <ul>
                  <li>Cleansing the skin with an antiseptic</li>
                  <li>Inserting a sterile needle into a vein, usually in my arm</li>
                  <li>Collecting blood into one or more tubes</li>
                  <li>Removing the needle and applying pressure to stop bleeding</li>
                  <li>Placing a bandage over the puncture site</li>
                </ul>
                
                <h4>Risks and Discomfort</h4>
                <p>I understand that blood draws are generally safe but may involve the following risks:</p>
                <ul>
                  <li>Temporary pain, discomfort, or bruising at the puncture site</li>
                  <li>Lightheadedness or fainting</li>
                  <li>Bleeding or hematoma (blood collecting under the skin)</li>
                  <li>Infection at the puncture site (rare)</li>
                  <li>Multiple needle sticks if a vein is difficult to access</li>
                </ul>
                
                <h4>Benefits</h4>
                <p>The blood tests I am ordering will provide important information about my health status and help support informed discussions with Range Medical about potential treatment options and health optimization strategies.</p>
                
                <h4>Alternatives</h4>
                <p>I understand that this blood draw is voluntary and that I am ordering these tests on my own initiative. I have the right to decline or postpone the blood draw at any time. However, choosing not to obtain these tests may limit the information available for my consultation with Range Medical.</p>
                
                <h4>Questions and Right to Refuse</h4>
                <p>I have been given the opportunity to ask questions about the blood draw procedure, and my questions have been answered to my satisfaction. I understand that I may withdraw my consent at any time before the procedure begins.</p>
              </div>
              
              <div className="checkbox-consent" id="consentCheckbox">
                <input type="checkbox" id="consentGiven" name="consentGiven" required />
                <label htmlFor="consentGiven">
                  <strong>I have read and understand the above information.</strong> I voluntarily consent to have blood drawn for laboratory testing that I am ordering for the purpose of consultation with Range Medical. I acknowledge that the procedure, risks, benefits, and alternatives have been explained to me.
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
              <p style={{ fontSize: '.875rem', color: 'var(--gray-600)', marginTop: '1rem' }}>By signing above, I certify that I am the patient (or authorized representative) and that the information provided is accurate.</p>
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
    consentType: 'blood_draw',
    consentTitle: 'Blood Draw Consent',
    emailjs: {
      publicKey: 'ZeNFfwJ37Uhd6E1vp',
      serviceId: 'service_pyl6wra',
      templateId: 'template_ecqidtm'
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
      customFieldKey: 'blood_work_consent',
      customFieldValue: 'Complete',
      tags: ['blood-draw-consent-signed', 'consent-completed']
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
    
    const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'dateOfBirth', 'consentDate'];
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
      const fileName = `blood-draw-consent-${formData.firstName}-${formData.lastName}-${timestamp}.pdf`;
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
    doc.text('Blood Draw Consent Form', pageWidth / 2, yPos, { align: 'center' });
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
    
    // Consent sections
    yPos += 15;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('CONSENT FOR BLOOD DRAW', margin, yPos);
    
    yPos += 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Purpose', margin, yPos);
    yPos += 6;
    doc.setFont('helvetica', 'normal');
    const purposeText = 'I understand that I am voluntarily ordering blood to be drawn from my vein for laboratory testing. I am obtaining these tests on my own initiative to discuss treatment options with Range Medical.';
    const purposeLines = doc.splitTextToSize(purposeText, pageWidth - 2 * margin);
    doc.text(purposeLines, margin, yPos);
    yPos += purposeLines.length * 5 + 5;
    
    doc.setFont('helvetica', 'bold');
    doc.text('Procedure', margin, yPos);
    yPos += 6;
    doc.setFont('helvetica', 'normal');
    const procedureText = 'The blood draw procedure involves: cleansing the skin, inserting a sterile needle into a vein, collecting blood, removing the needle and applying pressure, and placing a bandage.';
    const procedureLines = doc.splitTextToSize(procedureText, pageWidth - 2 * margin);
    doc.text(procedureLines, margin, yPos);
    yPos += procedureLines.length * 5 + 5;
    
    doc.setFont('helvetica', 'bold');
    doc.text('Risks', margin, yPos);
    yPos += 6;
    doc.setFont('helvetica', 'normal');
    const risksText = 'Possible risks include: temporary pain or bruising, lightheadedness or fainting, bleeding or hematoma, infection (rare), and multiple needle sticks if vein is difficult to access.';
    const risksLines = doc.splitTextToSize(risksText, pageWidth - 2 * margin);
    doc.text(risksLines, margin, yPos);
    yPos += risksLines.length * 5 + 10;
    
    if (yPos > pageHeight - 70) {
      doc.addPage();
      yPos = margin;
    }
    
    // Consent statement
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    const consentStatement = 'I have read and understand the above information. I voluntarily consent to have blood drawn for laboratory testing for consultation with Range Medical.';
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
BLOOD DRAW CONSENT FORM SUBMISSION
===================================

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

===================================
PDF consent form is attached.
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
      filename: `RangeMedical_BloodDrawConsent_${formData.lastName}_${formData.firstName}.pdf`
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
          <p>Your blood draw consent form has been submitted to Range Medical.</p>
          <p>Our team will review your consent before your appointment.</p>
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
      
      showStatus('Sending to Range Medical...', 'loading');
      try {
        await sendEmail(formData, pdfBlob);
      } catch (emailError) {
        console.warn('Email error (non-critical):', emailError);
      }
      
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
