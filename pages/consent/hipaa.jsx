import Head from 'next/head';
import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

export default function HIPAANotice() {
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
        <title>HIPAA Privacy Notice | Range Medical</title>
        <meta name="description" content="Notice of Privacy Practices for Range Medical." />
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
        .form-container { background: #fff; border: none; padding: 0 28px 40px; }
        .section { border-bottom: 1px solid #e5e5e5; padding: 28px 0; margin-bottom: 0; }
        .section:last-of-type { border-bottom: none; padding-bottom: 0; }
        .section-title { font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid #000; display: block; }
        .form-row { display: flex; gap: 16px; margin-bottom: 16px; }
        .form-row:last-child { margin-bottom: 0; }
        .form-group { flex: 1; display: flex; flex-direction: column; }
        .consent-container label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 4px; color: #333; text-transform: none; letter-spacing: normal; }
        .consent-container label .required { color: #dc2626; margin-left: 2px; }
        .consent-container input[type="text"],.consent-container input[type="email"],.consent-container input[type="tel"] { width: 100%; padding: 10px 12px; font-size: 14px; font-family: inherit; border: 1px solid #ccc; background: #fff; color: #111; border-radius: 0; transition: border-color 0.2s ease; }
        .consent-container input:focus { outline: none; border-color: #000; box-shadow: 0 0 0 2px rgba(0,0,0,0.1); }
        .consent-container input.error { border-color: #dc2626; }
        .consent-text { background: #fafafa; border: 1px solid #e5e5e5; border-radius: 0; padding: 20px; margin-bottom: 16px; line-height: 1.6; max-height: 50vh; overflow-y: auto; }
        .consent-text h4 { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin: 16px 0 8px; color: #262626; }
        .consent-text h4:first-child { margin-top: 0; }
        .consent-text p { margin-bottom: 8px; color: #404040; font-size: 14px; line-height: 1.6; }
        .consent-text ul { margin-left: 1.25rem; margin-bottom: 8px; }
        .consent-text li { margin-bottom: 6px; color: #404040; font-size: 14px; line-height: 1.6; }
        .consent-text strong { font-weight: 600; }
        .checkbox-consent { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 16px; padding: 14px 16px; background: #fafafa; border: 1px solid #e5e5e5; border-radius: 0; }
        .checkbox-consent input[type="checkbox"] { width: 18px; height: 18px; margin-top: 3px; cursor: pointer; accent-color: #000; flex-shrink: 0; }
        .checkbox-consent label { font-size: 13px; font-weight: 500; text-transform: none; letter-spacing: normal; margin-bottom: 0; cursor: pointer; color: #333; line-height: 1.55; }
        .checkbox-consent.error { border-color: #dc2626; background: #fef2f2; }
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
        .status-message.loading { background: #f5f5f5; color: #404040; border: 1px solid #d4d4d4; }
        .consent-footer { text-align: center; padding: 20px; border-top: 1px solid #e5e5e5; font-size: 12px; color: #999; }
        .consent-footer p { margin-bottom: 4px; }
        .thank-you-page { background: #fff; border: 2px solid #000; padding: 3rem 2rem; text-align: center; max-width: 720px; margin: 40px auto; }
        .thank-you-icon { width: 80px; height: 80px; background: #000; color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 3rem; margin: 0 auto 2rem; }
        .thank-you-page h1 { font-size: 2rem; font-weight: 700; margin-bottom: 1rem; color: #000; }
        .thank-you-subtitle { font-size: 1.125rem; color: #525252; margin-bottom: 2rem; }
        .thank-you-footer { padding-top: 2rem; border-top: 2px solid #e5e5e5; }
        .thank-you-footer p { font-size: 1.5rem; font-weight: 700; letter-spacing: 0.15em; color: #000; }
        .contact-info { background: #f5f5f5; padding: 12px; font-size: 13px; color: #525252; border-radius: 0; }
        .contact-info p { margin-bottom: 2px; }
        @media (max-width: 640px) { .consent-header { padding: 20px 16px; } .form-container { padding: 0 16px 30px; } .form-row { flex-direction: column; gap: 12px; } }
      `}</style>

      <div className="consent-container" id="consentContainer">
        <div className="consent-header">
          <h1 className="clinic-name">RANGE MEDICAL</h1>
          <p className="form-title">Notice of Privacy Practices (HIPAA)</p>
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
                  <label htmlFor="phone">Phone</label>
                  <input type="tel" id="phone" name="phone" autoComplete="tel" />
                </div>
              </div>
            </div>

            {/* HIPAA Notice */}
            <div className="section">
              <h3 className="section-title">Notice of Privacy Practices</h3>
              <div className="consent-text">
                <p><strong>Effective Date: January 1, 2025</strong></p>
                <p>This notice describes how medical information about you may be used and disclosed and how you can get access to this information.</p>

                <h4>Our Commitment to Your Privacy</h4>
                <p>Range Medical is committed to protecting your health information. We are required by law to maintain the privacy of your protected health information (PHI) and notify you if there is a breach.</p>

                <h4>How We Use Your Information</h4>
                <ul>
                  <li><strong>Treatment:</strong> To provide and coordinate your care with other healthcare providers.</li>
                  <li><strong>Payment:</strong> To bill and receive payment for services.</li>
                  <li><strong>Operations:</strong> To run our practice and improve care quality.</li>
                  <li><strong>As Required by Law:</strong> When required by federal, state, or local law.</li>
                </ul>

                <h4>Your Rights</h4>
                <ul>
                  <li>Request copies of your health records</li>
                  <li>Request corrections to your information</li>
                  <li>Request restrictions on how we use your information</li>
                  <li>Request confidential communications</li>
                  <li>Request a paper copy of this notice</li>
                </ul>

                <h4>Questions or Complaints</h4>
                <p>Contact our Privacy Officer or file a complaint with the U.S. Department of Health and Human Services. You will not be penalized for filing a complaint.</p>

                <div className="contact-info">
                  <p><strong>Range Medical</strong></p>
                  <p>1901 Westcliff Dr. Suite 10, Newport Beach, CA 92660</p>
                  <p>(949) 997-3988 | privacy@range-medical.com</p>
                </div>
              </div>

              <div className="checkbox-consent" id="consentCheckbox">
                <input type="checkbox" id="consentGiven" name="consentGiven" required />
                <label htmlFor="consentGiven">
                  I acknowledge that I have received and reviewed the Notice of Privacy Practices for Range Medical.
                </label>
              </div>
              <div className="field-error" id="consentError">You must acknowledge receipt to continue</div>
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
              <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '1rem' }}>
                By signing above, I confirm that I have received and reviewed the Notice of Privacy Practices.
              </p>
            </div>

            {/* Submit */}
            <div className="submit-section">
              <div className="validation-summary" id="validationSummary">
                <h3>Please complete the following required fields:</h3>
                <ul id="validationList"></ul>
              </div>
              <button type="submit" className="btn-submit" id="submitBtn">Submit Acknowledgment</button>
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

  const CONFIG = {
    consentType: 'hipaa',
    consentTitle: 'HIPAA Notice of Privacy Practices',
    supabase: {
      url: 'https://teivfptpozltpqwahgdl.supabase.co',
      anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlaXZmcHRwb3psdHBxd2FoZ2RsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3MTMxNDksImV4cCI6MjA4MDI4OTE0OX0.NrI1AykMBOh91mM9BFvpSH0JwzGrkv5ADDkZinh0elc'
    }
  };

  const urlParams = new URLSearchParams(window.location.search);
  const ghlContactId = urlParams.get('contactId') || urlParams.get('contact_id') || urlParams.get('cid') || '';
  const supabaseClient = window.supabase.createClient(CONFIG.supabase.url, CONFIG.supabase.anonKey);

  // Pre-fill from URL params (bundle passes fn, ln, em, ph, email, phone)
  ['fn:firstName', 'ln:lastName'].forEach(p => {
    const [k, id] = p.split(':');
    const v = urlParams.get(k);
    if (v) { const el = document.getElementById(id); if (el) el.value = v; }
  });
  // Email: check both 'email' and 'em' params
  const emailParam = urlParams.get('email') || urlParams.get('em');
  if (emailParam) { const el = document.getElementById('email'); if (el) el.value = emailParam; }
  // Phone: check both 'phone' and 'ph' params
  const phoneParam = urlParams.get('phone') || urlParams.get('ph');
  if (phoneParam) { const el = document.getElementById('phone'); if (el) el.value = phoneParam; }

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
    const summaryEl = document.getElementById('validationSummary');
    const listEl = document.getElementById('validationList');
    summaryEl.classList.remove('visible');
    listEl.innerHTML = '';

    const fieldLabels = { firstName: 'First Name', lastName: 'Last Name', email: 'Email' };
    ['firstName', 'lastName', 'email'].forEach(fieldId => {
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

    const consentCheckbox = document.getElementById('consentGiven');
    if (!consentCheckbox.checked) {
      document.getElementById('consentCheckbox').classList.add('error');
      document.getElementById('consentError').classList.add('visible');
      isValid = false;
      missingFields.push('Acknowledgment Checkbox');
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
      consentDate: new Date().toISOString().split('T')[0],
      consentGiven: document.getElementById('consentGiven').checked,
      signature: signaturePad.toDataURL('image/jpeg', 0.5),
      submissionDate: new Date().toLocaleString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
              timeZone: 'America/Los_Angeles',
      })
    };
  }

  // ============================================
  // UPLOAD TO SUPABASE STORAGE
  // ============================================
  async function uploadBase64ToStorage(base64Data, folder, patientName, extension) {
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
      const { error } = await supabaseClient.storage
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
      const fileName = `hipaa-${formData.firstName}-${formData.lastName}-${timestamp}.pdf`;
      const filePath = `consents/${fileName}`;
      const { error } = await supabaseClient.storage
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
      if (yPos + needed > pageHeight - 25) { doc.addPage(); yPos = 15; }
    }

    function addText(text, fontSize, isBold, color) {
      fontSize = fontSize || 9;
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

    // Header bar
    doc.setFillColor(0, 0, 0);
    doc.rect(0, 0, pageWidth, 22, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('RANGE MEDICAL', leftMargin, 10);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Notice of Privacy Practices (HIPAA)', leftMargin, 16);
    doc.setFontSize(8);
    doc.text('Document Date: ' + formData.consentDate, pageWidth - 15, 10, { align: 'right' });
    doc.text('1901 Westcliff Dr, Suite 10, Newport Beach, CA 92660', pageWidth - 15, 16, { align: 'right' });
    doc.setTextColor(0, 0, 0);
    yPos = 28;

    // Patient Information
    addSectionHeader('Patient Information');
    addLabelValue('Patient Name: ', formData.firstName + ' ' + formData.lastName);
    addLabelValue('Email: ', formData.email);
    if (formData.phone) addLabelValue('Phone: ', formData.phone);
    addLabelValue('Date: ', formData.consentDate);
    yPos += 2;

    // Notice of Privacy Practices
    addSectionHeader('Notice of Privacy Practices');
    addText('Effective Date: January 1, 2025', 9, true);
    addText('This notice describes how medical information about you may be used and disclosed and how you can get access to this information.', 8.5);
    yPos += 2;

    addText('Our Commitment to Your Privacy', 9, true);
    addText('Range Medical is committed to protecting your health information. We are required by law to maintain the privacy of your protected health information (PHI) and notify you if there is a breach.', 8.5);
    yPos += 2;

    addText('How We Use Your Information', 9, true);
    addText('Treatment: To provide and coordinate your care with other healthcare providers.', 8.5);
    addText('Payment: To bill and receive payment for services.', 8.5);
    addText('Operations: To run our practice and improve care quality.', 8.5);
    addText('As Required by Law: When required by federal, state, or local law.', 8.5);
    yPos += 2;

    addText('Your Rights', 9, true);
    addText('You have the right to: request copies of your health records, request corrections to your information, request restrictions on how we use your information, request confidential communications, and request a paper copy of this notice.', 8.5);
    yPos += 2;

    addText('Questions or Complaints', 9, true);
    addText('Contact our Privacy Officer or file a complaint with the U.S. Department of Health and Human Services. You will not be penalized for filing a complaint.', 8.5);
    yPos += 2;

    addText('Range Medical | 1901 Westcliff Dr. Suite 10, Newport Beach, CA 92660 | (949) 997-3988 | privacy@range-medical.com', 8, false, [100, 100, 100]);
    yPos += 4;

    // Acknowledgment
    addSectionHeader('Patient Acknowledgment');
    addText('I acknowledge that I have received and reviewed the Notice of Privacy Practices for Range Medical.', 9, true);
    yPos += 4;

    // Signature
    addSectionHeader('Patient Signature');
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

    // Footer on all pages
    var totalPages = doc.internal.getNumberOfPages();
    for (var i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(130);
      doc.text('Page ' + i + ' of ' + totalPages, pageWidth - 15, pageHeight - 4, { align: 'right' });
      doc.text('Range Medical | 1901 Westcliff Dr, Suite 10, Newport Beach, CA 92660 | (949) 997-3988', pageWidth / 2, pageHeight - 8, { align: 'center' });
      doc.text('CONFIDENTIAL — HIPAA Notice of Privacy Practices', pageWidth / 2, pageHeight - 4, { align: 'center' });
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
    const bundleToken = urlParams.get('bundle');
    if (bundleToken) { window.location.href = '/forms/' + bundleToken; return; }
    document.getElementById('consentContainer').innerHTML = `
      <div class="thank-you-page">
        <div class="thank-you-icon">✓</div>
        <h1>Thank You, ${formData.firstName}!</h1>
        <p class="thank-you-subtitle">Your HIPAA acknowledgment has been recorded.</p>
        <div style="padding:2rem;background:#fafafa;border:1.5px solid #e5e5e5;margin-bottom:2rem;">
          <p style="margin-bottom:0.75rem;color:#404040;">A copy of the Notice of Privacy Practices has been sent to your email.</p>
          <p style="color:#404040;">You may close this page.</p>
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
    if (!validateForm()) return;

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

      showStatus('Uploading document...', 'loading');
      const pdfUrl = await uploadPDFToStorage(pdfBlob, formData);

      const urls = { signatureUrl, pdfUrl };

      // Sync to GHL
      showStatus('Recording acknowledgment...', 'loading');
      try {
        await fetch('/api/hipaa-acknowledge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: formData.phone || null,
            contactId: ghlContactId || null,
            acknowledgedAt: new Date().toISOString(),
            signatureUrl: urls.signatureUrl,
            pdfUrl: urls.pdfUrl,
          })
        });
      } catch (ghlErr) {
        console.error('GHL sync error (non-critical):', ghlErr);
      }

      // Save consent to database
      showStatus('Saving consent record...', 'loading');
      await fetch('/api/consent-forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consentType: CONFIG.consentType,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          consentDate: formData.consentDate,
          consentGiven: formData.consentGiven,
          signatureUrl: urls.signatureUrl,
          pdfUrl: urls.pdfUrl,
          ghlContactId: ghlContactId,
        })
      });

      // Send patient email copy (non-blocking)
      try {
        fetch('/api/send-hipaa-copy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email,
            firstName: formData.firstName,
            lastName: formData.lastName,
            pdfUrl: urls.pdfUrl,
          })
        });
      } catch (emailErr) {
        console.error('Patient email error (non-critical):', emailErr);
      }

      showThankYouPage(formData);

    } catch (error) {
      console.error('Submission error:', error);
      showStatus('Error: ' + (error.message || 'Unknown error'), 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Acknowledgment';
    }
  });
}
