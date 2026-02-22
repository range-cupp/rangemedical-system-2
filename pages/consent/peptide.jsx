// pages/consent/peptide.js
// Peptide Therapy Consent Form
// Range Medical — Professional Consent with Full PDF Generation

import Head from 'next/head';
import { useEffect } from 'react';

export default function PeptideConsentPage() {
  useEffect(() => {
    const SUPABASE_URL = 'https://teivfptpozltpqwahgdl.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlaXZmcHRwb3psdHBxd2FoZ2RsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3MTMxNDksImV4cCI6MjA4MDI4OTE0OX0.NrI1AykMBOh91mM9BFvpSH0JwzGrkv5ADDkZinh0elc';
    const CONSENT_API = '/api/consent-to-ghl';
    const urlParams = new URLSearchParams(window.location.search);
    const ghlContactId = urlParams.get('contactId') || urlParams.get('contact_id') || urlParams.get('cid') || '';
    const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const canvas = document.getElementById('signaturePad');
    const signaturePad = new SignaturePad(canvas, { backgroundColor: 'rgb(255, 255, 255)', penColor: 'rgb(0, 0, 0)' });
    function resizeCanvas() { const ratio = Math.max(window.devicePixelRatio || 1, 1); const container = canvas.parentElement; canvas.width = container.offsetWidth * ratio; canvas.height = 150 * ratio; canvas.getContext('2d').scale(ratio, ratio); canvas.style.width = '100%'; canvas.style.height = '150px'; signaturePad.clear(); }
    window.addEventListener('resize', resizeCanvas); resizeCanvas();
    document.getElementById('clearSignature').addEventListener('click', () => signaturePad.clear());

    // DOB auto-format (MM/DD/YYYY)
    const dobInput = document.getElementById('dateOfBirth');
    dobInput.addEventListener('input', function(e) {
      let value = e.target.value.replace(/\D/g, '');
      if (value.length >= 2) value = value.slice(0, 2) + '/' + value.slice(2);
      if (value.length >= 5) value = value.slice(0, 5) + '/' + value.slice(5);
      if (value.length > 10) value = value.slice(0, 10);
      e.target.value = value;
    });

    document.querySelectorAll('.screening-radio').forEach(radio => { radio.addEventListener('change', function() { const d = document.getElementById(this.name + '-details'); if (d) d.style.display = (this.value === 'Yes') ? 'block' : 'none'; }); });
    function dataURLtoBlob(dataurl) { const arr = dataurl.split(','); const mime = arr[0].match(/:(.*?);/)[1]; const bstr = atob(arr[1]); let n = bstr.length; const u8arr = new Uint8Array(n); while (n--) u8arr[n] = bstr.charCodeAt(n); return new Blob([u8arr], { type: mime }); }

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

    document.getElementById('consentForm').addEventListener('submit', async function(e) {
      e.preventDefault();
      const submitBtn = document.getElementById('submitBtn');
      const statusMsg = document.getElementById('statusMessage');
      // Validation
      const missingFields = [];
      const summaryEl = document.getElementById('validationSummary');
      const listEl = document.getElementById('validationList');
      summaryEl.classList.remove('visible');
      listEl.innerHTML = '';
      document.getElementById('signatureError').style.display = 'none';

      const fields = [
        { id: 'firstName', label: 'First Name' },
        { id: 'lastName', label: 'Last Name' },
        { id: 'email', label: 'Email' },
        { id: 'phone', label: 'Phone' },
        { id: 'dateOfBirth', label: 'Date of Birth' }
      ];
      fields.forEach(f => {
        const el = document.getElementById(f.id);
        if (!el || !el.value.trim()) { if (el) el.style.borderColor = '#dc2626'; missingFields.push(f.label); }
        else { el.style.borderColor = ''; }
      });

      const screeningQuestions = [
        { name: 'allergies', label: 'Allergies question' },
        { name: 'pregnant', label: 'Pregnant/nursing question' },
        { name: 'medications', label: 'Medications question' },
        { name: 'autoimmune', label: 'Autoimmune disorder question' },
        { name: 'cancer', label: 'Cancer history question' },
        { name: 'selfInjecting', label: 'Self-injecting question' }
      ];
      screeningQuestions.forEach(q => {
        const checked = document.querySelector(`input[name="${q.name}"]:checked`);
        if (!checked) missingFields.push(q.label);
      });

      const ackBoxes = document.querySelectorAll('.ack-checkbox');
      let allChecked = true;
      ackBoxes.forEach(cb => { if (!cb.checked) { allChecked = false; cb.closest('.ack-item').style.borderColor = '#dc2626'; } else { cb.closest('.ack-item').style.borderColor = '#e5e7eb'; } });
      if (!allChecked) missingFields.push('All acknowledgment checkboxes');

      if (signaturePad.isEmpty()) { document.getElementById('signatureError').style.display = 'block'; missingFields.push('Signature'); }

      if (missingFields.length > 0) {
        listEl.innerHTML = missingFields.map(f => '<li>' + f + '</li>').join('');
        summaryEl.classList.add('visible');
        summaryEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      submitBtn.disabled = true; submitBtn.textContent = 'Submitting...'; statusMsg.style.display = 'none';

      try {
        const getValue = (id) => (document.getElementById(id)?.value || '').trim();
        const getRadio = (name) => { const r = document.querySelector(`input[name="${name}"]:checked`); return r ? r.value : ''; };
        const formData = {
          firstName: getValue('firstName'), lastName: getValue('lastName'), email: getValue('email'), phone: getValue('phone'), dateOfBirth: getValue('dateOfBirth'),
          consentDate: new Date().toLocaleDateString('en-US'), signatureData: signaturePad.toDataURL(),
          allergies: getRadio('allergies'), allergyDetails: getValue('allergyDetails'),
          pregnant: getRadio('pregnant'), medications: getRadio('medications'), medicationDetails: getValue('medicationDetails'),
          autoimmune: getRadio('autoimmune'), autoimmuneDetails: getValue('autoimmuneDetails'),
          cancer: getRadio('cancer'), cancerDetails: getValue('cancerDetails'),
          selfInjecting: getRadio('selfInjecting'),
        };
        const acknowledgments = []; ackBoxes.forEach(cb => { acknowledgments.push({ id: cb.id, text: cb.closest('.ack-item').querySelector('.ack-text').textContent.trim(), checked: cb.checked }); });
        formData.acknowledgments = acknowledgments;

        const pdfBlob = await generatePDF(formData);
        const sigFileName = `${formData.firstName}-${formData.lastName}-${Date.now()}.jpg`;
        const { error: sigError } = await supabaseClient.storage.from('medical-documents').upload(`signatures/${sigFileName}`, dataURLtoBlob(formData.signatureData), { contentType: 'image/jpeg' });
        const signatureUrl = sigError ? '' : `${SUPABASE_URL}/storage/v1/object/public/medical-documents/signatures/${sigFileName}`;
        const pdfFileName = `peptide-consent-${formData.firstName}-${formData.lastName}-${Date.now()}.pdf`;
        const { error: pdfError } = await supabaseClient.storage.from('medical-documents').upload(`consents/${pdfFileName}`, pdfBlob, { contentType: 'application/pdf' });
        const pdfUrl = pdfError ? '' : `${SUPABASE_URL}/storage/v1/object/public/medical-documents/consents/${pdfFileName}`;

        await supabaseClient.from('consents').insert({ consent_type: 'peptide', first_name: formData.firstName, last_name: formData.lastName, email: formData.email, phone: formData.phone, date_of_birth: formData.dateOfBirth || null, consent_date: new Date().toISOString().split('T')[0], consent_given: true, signature_url: signatureUrl, pdf_url: pdfUrl, additional_data: { ghl_contact_id: ghlContactId, health_screening: { allergies: formData.allergies, allergyDetails: formData.allergyDetails, pregnant: formData.pregnant, medications: formData.medications, medicationDetails: formData.medicationDetails, autoimmune: formData.autoimmune, autoimmuneDetails: formData.autoimmuneDetails, cancer: formData.cancer, cancerDetails: formData.cancerDetails, selfInjecting: formData.selfInjecting }, acknowledgments } });
        try { await fetch(CONSENT_API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ consentType: 'peptide', firstName: formData.firstName, lastName: formData.lastName, email: formData.email, phone: formData.phone, dateOfBirth: formData.dateOfBirth, consentDate: formData.consentDate, pdfUrl, signatureUrl, ghlContactId }) }); } catch(e) {}

        showThankYouPage(formData);
      } catch (err) { console.error(err); statusMsg.textContent = 'Error submitting form. Please try again.'; statusMsg.className = 'status-message error'; statusMsg.style.display = 'block'; submitBtn.disabled = false; submitBtn.textContent = 'Submit Consent'; }
    });

    function showThankYouPage(formData) {
      document.getElementById('consentContainer').innerHTML = `
        <div class="thank-you-page">
          <div class="thank-you-icon">✓</div>
          <h1>Thank You, ${formData.firstName}!</h1>
          <p class="thank-you-subtitle">Your form has been sent.</p>
          <div class="thank-you-details">
            <p>We received your Peptide Therapy consent form.</p>
            <p>Our team will review it before your treatment.</p>
          </div>
          <div class="thank-you-contact">
            <h3>Have Questions?</h3>
            <p>Email us at <a href="mailto:info@range-medical.com">info@range-medical.com</a></p>
          </div>
          <div class="thank-you-footer">
            <p>RANGE MEDICAL</p>
          </div>
        </div>
      `;
    }

    async function generatePDF(formData) {
      const jsPDF = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
      const doc = new jsPDF({ compress: true }); let yPos = 15; const leftMargin = 15; const pageWidth = doc.internal.pageSize.getWidth(); const pageHeight = doc.internal.pageSize.getHeight(); const contentWidth = pageWidth - 30;
      function checkPageBreak(needed = 20) { if (yPos + needed > pageHeight - 25) { doc.addPage(); yPos = 15; } }
      function addText(text, fontSize = 9, isBold = false) { doc.setFontSize(fontSize); doc.setFont('helvetica', isBold ? 'bold' : 'normal'); doc.setTextColor(0); const lines = doc.splitTextToSize(text, contentWidth); checkPageBreak(lines.length * (fontSize * 0.45) + 4); doc.text(lines, leftMargin, yPos); yPos += lines.length * (fontSize * 0.45) + 2; }
      function addSectionHeader(text) { checkPageBreak(15); yPos += 4; doc.setFillColor(0); doc.rect(leftMargin, yPos - 4, contentWidth, 8, 'F'); doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(255); doc.text(text.toUpperCase(), leftMargin + 3, yPos + 1); doc.setTextColor(0); yPos += 8; }
      function addLabelValue(label, value) { checkPageBreak(8); doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.text(label, leftMargin, yPos); doc.setFont('helvetica', 'normal'); doc.text(value || 'N/A', leftMargin + doc.getTextWidth(label) + 2, yPos); yPos += 5; }
      const patientInitials = ((formData.firstName || '').charAt(0) + (formData.lastName || '').charAt(0)).toUpperCase();
      function addCheckboxLine(text, isChecked = true) { const lines = doc.splitTextToSize(text, contentWidth - 10); checkPageBreak(lines.length * 4.5 + 3); doc.setDrawColor(0); if (isChecked) { doc.setFillColor(0, 0, 0); doc.rect(leftMargin, yPos - 3, 5, 5, 'FD'); doc.setFont('helvetica', 'bold'); doc.setFontSize(6); doc.setTextColor(255, 255, 255); doc.text(patientInitials, leftMargin + 2.5, yPos + 0.5, { align: 'center' }); doc.setTextColor(0, 0, 0); } else { doc.rect(leftMargin, yPos - 3, 5, 5); } doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.text(lines, leftMargin + 8, yPos); yPos += lines.length * 4 + 2; }

      doc.setFillColor(0); doc.rect(0, 0, pageWidth, 22, 'F'); doc.setTextColor(255); doc.setFontSize(16); doc.setFont('helvetica', 'bold'); doc.text('RANGE MEDICAL', leftMargin, 10); doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.text('Peptide Therapy — Informed Consent', leftMargin, 16); doc.setFontSize(8); doc.text(`Document Date: ${formData.consentDate}`, pageWidth - 15, 10, { align: 'right' }); doc.text('1901 Westcliff Dr, Suite 10, Newport Beach, CA 92660', pageWidth - 15, 16, { align: 'right' }); doc.setTextColor(0); yPos = 28;

      addSectionHeader('Patient Information');
      addLabelValue('Patient Name: ', `${formData.firstName} ${formData.lastName}`); addLabelValue('Date of Birth: ', formData.dateOfBirth); addLabelValue('Email: ', formData.email); addLabelValue('Phone: ', formData.phone); addLabelValue('Consent Date: ', formData.consentDate);

      addSectionHeader('Description of Peptide Therapy');
      addText('Peptide therapy involves the administration of synthetic or naturally-derived peptide compounds via subcutaneous injection, intramuscular injection, oral administration, or topical application. Peptides are short chains of amino acids that serve as signaling molecules in the body, influencing processes including tissue repair, immune modulation, growth hormone secretion, inflammation response, and cellular regeneration.', 8.5);
      addText('Peptide therapies provided by Range Medical are elective wellness and optimization services. Many peptide compounds are used in an off-label or investigational capacity. These therapies are not FDA-approved for all intended uses and are not intended to diagnose, treat, cure, or prevent any disease.', 8.5);

      addSectionHeader('Health Screening Responses');
      addLabelValue('Known Allergies: ', formData.allergies + (formData.allergyDetails ? ` — ${formData.allergyDetails}` : ''));
      addLabelValue('Pregnant or Nursing: ', formData.pregnant || 'N/A');
      addLabelValue('Current Medications: ', formData.medications + (formData.medicationDetails ? ` — ${formData.medicationDetails}` : ''));
      addLabelValue('Autoimmune Disorder: ', formData.autoimmune + (formData.autoimmuneDetails ? ` — ${formData.autoimmuneDetails}` : ''));
      addLabelValue('Cancer History: ', formData.cancer + (formData.cancerDetails ? ` — ${formData.cancerDetails}` : ''));
      addLabelValue('Self-Injecting (Take-Home): ', formData.selfInjecting || 'N/A');

      addSectionHeader('Risks & Potential Complications');
      addText('The following risks associated with peptide therapy have been disclosed:', 8.5);
      const risks = ['Pain, redness, swelling, itching, or bruising at the injection site', 'Localized infection at the injection site', 'Allergic or hypersensitivity reactions, including anaphylaxis (rare)', 'Nausea, headache, dizziness, fatigue, or flushing', 'Water retention or joint stiffness', 'Changes in blood glucose levels', 'Numbness or tingling in extremities', 'Increased hunger or changes in appetite', 'Interaction with current medications or supplements', 'Immune system modulation that may exacerbate autoimmune conditions', 'Theoretical risk of promoting abnormal cell growth in patients with active or undiagnosed malignancy', 'Unintended hormonal effects', 'Unknown long-term effects, as some peptides lack extensive human clinical data', 'Unforeseen complications or side effects not listed above'];
      risks.forEach(r => { checkPageBreak(8); doc.setFontSize(8); const lines = doc.splitTextToSize(`• ${r}`, contentWidth - 5); doc.text(lines, leftMargin + 3, yPos); yPos += lines.length * 3.8 + 1; });

      addSectionHeader('Patient Acknowledgments & Agreement');
      addText('By signing below, the patient affirms that each of the following statements has been read, understood, and individually acknowledged:', 8.5); yPos += 2;
      if (formData.acknowledgments) { formData.acknowledgments.forEach(ack => { addCheckboxLine(ack.text, ack.checked); }); }

      addSectionHeader('Patient Signature');
      addLabelValue('Signed by: ', `${formData.firstName} ${formData.lastName}`); addLabelValue('Date: ', formData.consentDate);
      if (formData.signatureData && formData.signatureData.startsWith('data:')) { checkPageBreak(35); try { doc.addImage(formData.signatureData, 'PNG', leftMargin, yPos, 60, 25); yPos += 28; } catch(e) {} }
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) { doc.setPage(i); doc.setFontSize(7); doc.setTextColor(130); doc.text(`Page ${i} of ${totalPages}`, pageWidth - 15, pageHeight - 4, { align: 'right' }); doc.text('Range Medical | 1901 Westcliff Dr, Suite 10, Newport Beach, CA 92660', pageWidth / 2, pageHeight - 8, { align: 'center' }); doc.text('CONFIDENTIAL — Peptide Therapy Informed Consent', pageWidth / 2, pageHeight - 4, { align: 'center' }); }
      return doc.output('blob');
    }
  }, []);

  return (
    <>
      <Head><title>Peptide Therapy Consent | Range Medical</title><meta name="viewport" content="width=device-width, initial-scale=1" /><script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script><script src="https://cdn.jsdelivr.net/npm/signature_pad@4.0.0/dist/signature_pad.umd.min.js"></script><script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script></Head>
      <div id="consentContainer" className="consent-page">
        <header className="consent-header"><div className="header-inner"><h1>RANGE MEDICAL</h1><p>Peptide Therapy — Informed Consent</p></div></header>
        <form id="consentForm" className="consent-form">
          <div className="section"><h2 className="section-title">Patient Information</h2><div className="form-row"><div className="form-group"><label htmlFor="firstName">First Name <span className="req">*</span></label><input type="text" id="firstName" required /></div><div className="form-group"><label htmlFor="lastName">Last Name <span className="req">*</span></label><input type="text" id="lastName" required /></div></div><div className="form-row"><div className="form-group"><label htmlFor="email">Email <span className="req">*</span></label><input type="email" id="email" required /></div><div className="form-group"><label htmlFor="phone">Phone <span className="req">*</span></label><input type="tel" id="phone" required /><p style={{ fontSize: '0.6rem', color: '#a3a3a3', lineHeight: 1.4, marginTop: '0.25rem' }}>By providing my phone number, I agree to receive texts from Range Medical. Msg &amp; data rates may apply. Up to 10 msg/mo. Reply STOP to opt out. <a href="/terms-of-use" target="_blank" rel="noopener noreferrer" style={{ color: '#a3a3a3', textDecoration: 'underline' }}>Terms</a> &amp; <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" style={{ color: '#a3a3a3', textDecoration: 'underline' }}>Privacy</a>.</p></div></div><div className="form-row"><div className="form-group"><label htmlFor="dateOfBirth">Date of Birth <span className="req">*</span></label><input type="text" id="dateOfBirth" placeholder="MM/DD/YYYY" maxLength="10" required /></div></div></div>

          <div className="section"><h2 className="section-title">Description of Peptide Therapy</h2><div className="info-block"><p>Peptide therapy involves the administration of synthetic or naturally-derived peptide compounds via subcutaneous injection, intramuscular injection, oral administration, or topical application. Peptides are short chains of amino acids that serve as signaling molecules in the body, influencing processes including tissue repair, immune modulation, growth hormone secretion, inflammation response, and cellular regeneration.</p><p>Peptide therapies provided by Range Medical are <strong>elective wellness and optimization services</strong>. Many peptide compounds are used in an <strong>off-label or investigational capacity</strong>. These therapies are not FDA-approved for all intended uses and are not intended to diagnose, treat, cure, or prevent any disease.</p></div></div>

          <div className="section"><h2 className="section-title">Health Screening</h2>
            <div className="screening-item"><label className="screening-label">Do you have any known allergies to medications, peptides, amino acids, or preservatives? <span className="req">*</span></label><div className="radio-row"><label><input type="radio" name="allergies" value="Yes" required className="screening-radio" /> Yes</label><label><input type="radio" name="allergies" value="No" className="screening-radio" /> No</label></div><div id="allergies-details" className="details-field" style={{display:'none'}}><label htmlFor="allergyDetails">Please list all allergies:</label><textarea id="allergyDetails" rows="2"></textarea></div></div>
            <div className="screening-item"><label className="screening-label">Are you currently pregnant, nursing, or planning to become pregnant? <span className="req">*</span></label><div className="radio-row"><label><input type="radio" name="pregnant" value="Yes" required className="screening-radio" /> Yes</label><label><input type="radio" name="pregnant" value="No" className="screening-radio" /> No</label><label><input type="radio" name="pregnant" value="N/A" className="screening-radio" /> N/A</label></div></div>
            <div className="screening-item"><label className="screening-label">Are you currently taking any medications or supplements? <span className="req">*</span></label><div className="radio-row"><label><input type="radio" name="medications" value="Yes" required className="screening-radio" /> Yes</label><label><input type="radio" name="medications" value="No" className="screening-radio" /> No</label></div><div id="medications-details" className="details-field" style={{display:'none'}}><label htmlFor="medicationDetails">Please list all medications and supplements:</label><textarea id="medicationDetails" rows="2"></textarea></div></div>
            <div className="screening-item"><label className="screening-label">Have you been diagnosed with an autoimmune disorder? <span className="req">*</span></label><div className="radio-row"><label><input type="radio" name="autoimmune" value="Yes" required className="screening-radio" /> Yes</label><label><input type="radio" name="autoimmune" value="No" className="screening-radio" /> No</label></div><div id="autoimmune-details" className="details-field" style={{display:'none'}}><label htmlFor="autoimmuneDetails">Please describe:</label><textarea id="autoimmuneDetails" rows="2"></textarea></div></div>
            <div className="screening-item"><label className="screening-label">Do you have a current or prior history of cancer? <span className="req">*</span></label><div className="radio-row"><label><input type="radio" name="cancer" value="Yes" required className="screening-radio" /> Yes</label><label><input type="radio" name="cancer" value="No" className="screening-radio" /> No</label></div><div id="cancer-details" className="details-field" style={{display:'none'}}><label htmlFor="cancerDetails">Please describe type and status:</label><textarea id="cancerDetails" rows="2"></textarea></div></div>
            <div className="screening-item"><label className="screening-label">Will you be self-administering injections at home (take-home protocol)? <span className="req">*</span></label><div className="radio-row"><label><input type="radio" name="selfInjecting" value="Yes" required className="screening-radio" /> Yes</label><label><input type="radio" name="selfInjecting" value="No" className="screening-radio" /> No</label><label><input type="radio" name="selfInjecting" value="Unsure" className="screening-radio" /> Unsure</label></div></div>
          </div>

          <div className="section"><h2 className="section-title">Risks & Potential Complications</h2><div className="info-block"><p>Peptide therapy carries inherent medical risks. The following potential risks and complications have been disclosed:</p><ul className="risk-list"><li>Pain, redness, swelling, itching, or bruising at the injection site</li><li>Localized infection at the injection site</li><li>Allergic or hypersensitivity reactions, including anaphylaxis (rare)</li><li>Nausea, headache, dizziness, fatigue, or flushing</li><li>Water retention or joint stiffness</li><li>Changes in blood glucose levels</li><li>Numbness or tingling in extremities</li><li>Increased hunger or changes in appetite</li><li>Interaction with current medications or supplements</li><li>Immune system modulation that may exacerbate autoimmune conditions</li><li>Theoretical risk of promoting abnormal cell growth in patients with active or undiagnosed malignancy</li><li>Unintended hormonal effects</li><li>Unknown long-term effects, as some peptides lack extensive human clinical data</li><li>Unforeseen complications or side effects not listed above</li></ul></div></div>

          <div className="section"><h2 className="section-title">Patient Acknowledgments & Agreement</h2><p className="section-desc">Please read each statement carefully and check the box to confirm your understanding and agreement. <strong>All boxes must be checked to proceed.</strong></p>
            <div className="ack-item"><label><input type="checkbox" id="ack1" className="ack-checkbox" required /><span className="ack-initials"></span><span className="ack-text">I understand that peptide therapies provided by Range Medical are elective wellness and optimization services. These services are not intended to diagnose, treat, cure, or prevent any disease or medical condition. I acknowledge that peptide therapy does not replace evaluation, diagnosis, or treatment by my primary care physician or any specialist.</span></label></div>
            <div className="ack-item"><label><input type="checkbox" id="ack2" className="ack-checkbox" required /><span className="ack-initials"></span><span className="ack-text">I understand that many peptide compounds are used off-label or in an investigational capacity. Off-label use refers to the medically accepted practice of using compounds for purposes, dosages, or routes of administration not specifically included in FDA-approved labeling. I consent to such off-label or investigational use when recommended by Range Medical's clinical staff.</span></label></div>
            <div className="ack-item"><label><input type="checkbox" id="ack3" className="ack-checkbox" required /><span className="ack-initials"></span><span className="ack-text">I understand that individual results from peptide therapy vary and are not guaranteed. Range Medical makes no representations, warranties, or guarantees regarding the specific outcomes, efficacy, or therapeutic benefit of any peptide compound administered or prescribed.</span></label></div>
            <div className="ack-item"><label><input type="checkbox" id="ack4" className="ack-checkbox" required /><span className="ack-initials"></span><span className="ack-text">I have been informed of the risks and potential complications associated with peptide therapy, as detailed above. I accept these risks voluntarily and understand that complications may occur even when all procedures are performed correctly.</span></label></div>
            <div className="ack-item"><label><input type="checkbox" id="ack5" className="ack-checkbox" required /><span className="ack-initials"></span><span className="ack-text">I confirm that I have disclosed all relevant medical history, current medications, known allergies, autoimmune conditions, cancer history, and pre-existing health conditions. I understand that failure to disclose accurate information may compromise the safety of my treatment and that Range Medical shall not be held liable for complications arising from undisclosed medical information.</span></label></div>
            <div className="ack-item"><label><input type="checkbox" id="ack6" className="ack-checkbox" required /><span className="ack-initials"></span><span className="ack-text">I acknowledge that peptide therapy is not a substitute for routine medical care. I understand that I should continue to see my primary care physician and any specialists for the management of existing health conditions and preventive care.</span></label></div>
            <div className="ack-item"><label><input type="checkbox" id="ack7" className="ack-checkbox" required /><span className="ack-initials"></span><span className="ack-text">If I am self-administering peptides at home, I understand that I am solely responsible for proper storage, reconstitution, dosing, injection technique, and disposal of materials as instructed. I agree to follow all instructions provided by Range Medical and to contact the clinic immediately if I experience any adverse reaction or uncertainty about my protocol.</span></label></div>
            <div className="ack-item"><label><input type="checkbox" id="ack8" className="ack-checkbox" required /><span className="ack-initials"></span><span className="ack-text">I agree to immediately notify Range Medical staff if I experience any adverse reaction, unusual symptoms, or change in my condition during or after treatment.</span></label></div>
            <div className="ack-item"><label><input type="checkbox" id="ack9" className="ack-checkbox" required /><span className="ack-initials"></span><span className="ack-text">I understand that I have the right to refuse or discontinue treatment at any time without penalty.</span></label></div>
            <div className="ack-item"><label><input type="checkbox" id="ack10" className="ack-checkbox" required /><span className="ack-initials"></span><span className="ack-text">I voluntarily assume full responsibility for any risks associated with peptide therapy. I release, discharge, and hold harmless Range Medical, its medical director, physicians, nurse practitioners, registered nurses, medical assistants, staff, and affiliated entities from any and all claims, liabilities, damages, or causes of action arising out of or related to the services provided, except in cases of gross negligence or willful misconduct.</span></label></div>
            <div className="ack-item"><label><input type="checkbox" id="ack11" className="ack-checkbox" required /><span className="ack-initials"></span><span className="ack-text">I acknowledge that I am financially responsible for all services rendered. Payment is due at the time of service. Refunds are not provided for completed treatments or dispensed medications.</span></label></div>
            <div className="ack-item"><label><input type="checkbox" id="ack12" className="ack-checkbox" required /><span className="ack-initials"></span><span className="ack-text">I authorize Range Medical to contact me via phone, text message, and/or email for purposes related to my care.</span></label></div>
            <div className="ack-item"><label><input type="checkbox" id="ack13" className="ack-checkbox" required /><span className="ack-initials"></span><span className="ack-text">I confirm that I am at least 18 years of age, that I have read this consent form in its entirety, that I have had the opportunity to ask questions, and that I am signing voluntarily.</span></label></div>
          </div>

          <div className="section"><h2 className="section-title">Patient Signature</h2><p className="section-desc">By signing below, I certify that I have read, understood, and agree to all statements contained in this Informed Consent for Peptide Therapy.</p><div className="signature-container"><canvas id="signaturePad" className="signature-pad"></canvas></div><div className="signature-actions"><button type="button" className="btn-clear" id="clearSignature">Clear Signature</button></div><span className="field-error" id="signatureError" style={{display:'none'}}>Signature is required</span></div>
          <div className="submit-section"><div className="validation-summary" id="validationSummary"><h3>Please complete the following required fields:</h3><ul id="validationList"></ul></div><button type="submit" className="btn-submit" id="submitBtn">Submit Consent</button><div className="status-message" id="statusMessage" style={{display:'none'}}></div></div>
        </form>
        <footer className="consent-footer"><p>&copy; 2026 Range Medical. All rights reserved.</p><p>Your information is protected and kept confidential.</p></footer>
      </div>
      <style jsx global>{`*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;background:#f9f9f9;color:#111}.consent-page{max-width:720px;margin:0 auto;background:#fff;min-height:100vh}.consent-header{background:#000;color:#fff;padding:24px 28px}.consent-header h1{font-size:22px;font-weight:700;letter-spacing:2px;margin-bottom:4px;color:#fff}.consent-header p{font-size:14px;opacity:.85;color:#fff}.consent-form{padding:0 28px 40px}.section{border-bottom:1px solid #e5e5e5;padding:28px 0}.section:last-of-type{border-bottom:none}.section-title{font-size:16px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:16px;padding-bottom:8px;border-bottom:2px solid #000}.section-desc{font-size:14px;color:#444;margin-bottom:16px;line-height:1.5}.form-row{display:flex;gap:16px;margin-bottom:16px}.form-group{flex:1}.form-group label{display:block;font-size:13px;font-weight:600;margin-bottom:4px;color:#333}.form-group input,.form-group textarea{width:100%;padding:10px 12px;border:1px solid #ccc;border-radius:4px;font-size:14px}.form-group input:focus,.form-group textarea:focus{border-color:#000;outline:none;box-shadow:0 0 0 2px rgba(0,0,0,.1)}.req{color:#dc2626}.info-block{background:#fafafa;border:1px solid #e5e5e5;border-radius:6px;padding:20px}.info-block p{font-size:14px;line-height:1.6;color:#333;margin-bottom:12px}.info-block p:last-child{margin-bottom:0}.risk-list{padding-left:20px;margin-top:8px}.risk-list li{font-size:13px;line-height:1.5;color:#444;margin-bottom:6px}.screening-item{background:#fafafa;border:1px solid #e5e5e5;border-radius:6px;padding:16px;margin-bottom:12px}.screening-label{font-size:14px;font-weight:600;display:block;margin-bottom:6px}.radio-row{display:flex;gap:20px;margin-top:4px}.radio-row label{font-size:14px;cursor:pointer;display:flex;align-items:center;gap:6px}.details-field{margin-top:10px}.details-field label{font-size:13px;font-weight:500;display:block;margin-bottom:4px}.details-field textarea{width:100%;padding:8px 10px;border:1px solid #ccc;border-radius:4px;font-size:13px;resize:vertical}.ack-item{border:1px solid #e5e7eb;border-radius:6px;padding:14px 16px;margin-bottom:10px;transition:border-color .2s}.ack-item label{display:flex;gap:12px;cursor:pointer;align-items:flex-start}.ack-checkbox{position:absolute;opacity:0;width:0;height:0}.ack-initials{width:28px;height:28px;min-width:28px;border:2px solid #d4d4d4;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;letter-spacing:0.5px;color:transparent;background:#fff;cursor:pointer;transition:all 0.15s;margin-top:1px;user-select:none}.ack-checkbox:checked+.ack-initials{background:#000;border-color:#000;color:#fff}.ack-text{font-size:13px;line-height:1.55;color:#333}.signature-container{border:2px solid #000;border-radius:6px;margin-bottom:8px;overflow:hidden}.signature-pad{width:100%;height:150px;cursor:crosshair}.signature-actions{text-align:right}.btn-clear{background:none;border:1px solid #ccc;padding:6px 14px;border-radius:4px;cursor:pointer;font-size:13px}.field-error{color:#dc2626;font-size:12px;display:block;margin-top:4px}.submit-section{padding-top:20px;text-align:center}.btn-submit{background:#000;color:#fff;border:none;padding:14px 48px;font-size:16px;font-weight:600;border-radius:6px;cursor:pointer}.btn-submit:disabled{background:#999;cursor:not-allowed}
        .validation-summary{background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:1rem 1.5rem;margin-bottom:1rem;display:none}
        .validation-summary.visible{display:block}
        .validation-summary h3{color:#991b1b;font-size:.9375rem;margin-bottom:.5rem}
        .validation-summary ul{margin:0;padding-left:1.25rem;color:#dc2626;font-size:.875rem}
        .validation-summary ul li{margin-bottom:.25rem}.status-message{margin-top:16px;padding:12px;border-radius:6px;font-size:14px;text-align:center}.status-message.success{background:#f0fdf4;color:#15803d;border:1px solid #86efac}.status-message.error{background:#fef2f2;color:#b91c1c;border:1px solid #fecaca}.consent-footer{text-align:center;padding:20px;border-top:1px solid #e5e5e5;font-size:12px;color:#999}.thank-you-page{background:#fff;border:2px solid #000;padding:3rem 2rem;text-align:center;max-width:720px;margin:40px auto}.thank-you-icon{width:80px;height:80px;background:#000;color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:3rem;margin:0 auto 2rem}.thank-you-page h1{font-size:2rem;font-weight:700;margin-bottom:1rem;color:#000}.thank-you-subtitle{font-size:1.125rem;color:#525252;margin-bottom:2rem}.thank-you-details{padding:2rem;background:#fafafa;border:1.5px solid #e5e5e5;margin-bottom:2rem}.thank-you-details p{margin-bottom:.75rem;color:#404040}.thank-you-contact{margin-bottom:2rem}.thank-you-contact h3{font-size:1rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em;margin-bottom:.5rem;color:#262626}.thank-you-contact a{color:#000;text-decoration:underline}.thank-you-footer{padding-top:2rem;border-top:2px solid #e5e5e5}.thank-you-footer p{font-size:1.5rem;font-weight:700;letter-spacing:.15em;color:#000}@media(max-width:640px){.form-row{flex-direction:column;gap:12px}.consent-form{padding:0 16px 30px}.consent-header{padding:20px 16px}.radio-row{flex-wrap:wrap}}`}</style>
    </>
  );
}
