// pages/consent/knee-aspiration.jsx
// Knee Aspiration (Joint Drainage) Consent Form
// Range Medical — Professional Consent with Full PDF Generation
// All acknowledgments appear individually on the generated PDF

import Head from 'next/head';
import { useEffect } from 'react';

export default function KneeAspirationConsentPage() {
  useEffect(() => {
    // ============================================
    // CONFIGURATION
    // ============================================
    const SUPABASE_URL = 'https://teivfptpozltpqwahgdl.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlaXZmcHRwb3psdHBxd2FoZ2RsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3MTMxNDksImV4cCI6MjA4MDI4OTE0OX0.NrI1AykMBOh91mM9BFvpSH0JwzGrkv5ADDkZinh0elc';
    const CONSENT_API = '/api/consent-to-ghl';

    const urlParams = new URLSearchParams(window.location.search);
    const ghlContactId = urlParams.get('contactId') || urlParams.get('contact_id') || urlParams.get('cid') || '';

    const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Pre-fill from bundle query params
    ['fn:firstName','ln:lastName','em:email','ph:phone','dob:dateOfBirth'].forEach(p => {
      const [k, id] = p.split(':');
      const v = urlParams.get(k);
      if (v) { const el = document.getElementById(id); if (el) el.value = v; }
    });

    // ============================================
    // SIGNATURE PAD
    // ============================================
    const canvas = document.getElementById('signaturePad');
    const signaturePad = new SignaturePad(canvas, {
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

    // ============================================
    // FORM SUBMISSION
    // ============================================
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

      // Required text fields
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

      // Health screening radios
      const screeningQuestions = [
        { name: 'bloodThinners', label: 'Blood thinners question' },
        { name: 'allergies', label: 'Allergies question' },
        { name: 'pregnant', label: 'Pregnant/nursing question' },
        { name: 'jointInfection', label: 'Joint infection question' },
        { name: 'skinCondition', label: 'Skin condition question' },
        { name: 'prosthetic', label: 'Prosthetic joint question' },
        { name: 'bleedingDisorder', label: 'Bleeding disorder question' }
      ];
      screeningQuestions.forEach(q => {
        const checked = document.querySelector(`input[name="${q.name}"]:checked`);
        if (!checked) missingFields.push(q.label);
      });

      // Acknowledgments
      const ackBoxes = document.querySelectorAll('.ack-checkbox');
      let allChecked = true;
      ackBoxes.forEach(cb => {
        if (!cb.checked) {
          allChecked = false;
          cb.closest('.ack-item').style.borderColor = '#dc2626';
        } else {
          cb.closest('.ack-item').style.borderColor = '#e5e7eb';
        }
      });
      if (!allChecked) missingFields.push('All acknowledgment checkboxes');

      // Signature
      if (signaturePad.isEmpty()) { document.getElementById('signatureError').style.display = 'block'; missingFields.push('Signature'); }

      if (missingFields.length > 0) {
        listEl.innerHTML = missingFields.map(f => '<li>' + f + '</li>').join('');
        summaryEl.classList.add('visible');
        summaryEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting...';
      statusMsg.style.display = 'none';

      try {
        const getValue = (id) => (document.getElementById(id)?.value || '').trim();
        const getRadio = (name) => {
          const r = document.querySelector(`input[name="${name}"]:checked`);
          return r ? r.value : '';
        };

        const formData = {
          firstName: getValue('firstName'),
          lastName: getValue('lastName'),
          email: getValue('email'),
          phone: getValue('phone'),
          dateOfBirth: getValue('dateOfBirth'),
          consentDate: new Date().toLocaleDateString('en-US'),
          signatureData: signaturePad.toDataURL(),
          // Health screening
          bloodThinners: getRadio('bloodThinners'),
          bloodThinnersDetails: getValue('bloodThinnersDetails'),
          allergies: getRadio('allergies'),
          allergyDetails: getValue('allergyDetails'),
          pregnant: getRadio('pregnant'),
          jointInfection: getRadio('jointInfection'),
          jointInfectionDetails: getValue('jointInfectionDetails'),
          skinCondition: getRadio('skinCondition'),
          skinConditionDetails: getValue('skinConditionDetails'),
          prosthetic: getRadio('prosthetic'),
          prostheticDetails: getValue('prostheticDetails'),
          bleedingDisorder: getRadio('bleedingDisorder'),
          bleedingDisorderDetails: getValue('bleedingDisorderDetails'),
        };

        // Collect acknowledgments
        const acknowledgments = [];
        ackBoxes.forEach(cb => {
          acknowledgments.push({
            id: cb.id,
            text: cb.closest('.ack-item').querySelector('.ack-text').textContent.trim(),
            checked: cb.checked
          });
        });
        formData.acknowledgments = acknowledgments;

        // Generate PDF
        const pdfBlob = await generatePDF(formData);

        // Upload signature
        const sigFileName = `${formData.firstName}-${formData.lastName}-${Date.now()}.jpg`;
        const { data: sigData, error: sigError } = await supabaseClient.storage
          .from('medical-documents')
          .upload(`signatures/${sigFileName}`, dataURLtoBlob(formData.signatureData), { contentType: 'image/jpeg' });

        const signatureUrl = sigError ? '' :
          `${SUPABASE_URL}/storage/v1/object/public/medical-documents/signatures/${sigFileName}`;

        // Upload PDF
        const pdfFileName = `knee-aspiration-consent-${formData.firstName}-${formData.lastName}-${Date.now()}.pdf`;
        const { data: pdfData, error: pdfError } = await supabaseClient.storage
          .from('medical-documents')
          .upload(`consents/${pdfFileName}`, pdfBlob, { contentType: 'application/pdf' });

        const pdfUrl = pdfError ? '' :
          `${SUPABASE_URL}/storage/v1/object/public/medical-documents/consents/${pdfFileName}`;

        // Save to database via server-side API
        try {
          await fetch('/api/consent-forms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              consentType: 'knee-aspiration',
              firstName: formData.firstName,
              lastName: formData.lastName,
              email: formData.email,
              phone: formData.phone,
              dateOfBirth: formData.dateOfBirth,
              consentDate: new Date().toISOString().split('T')[0],
              consentGiven: true,
              signatureUrl: signatureUrl,
              pdfUrl: pdfUrl,
              ghlContactId: ghlContactId,
              additionalData: {
                health_screening: {
                  bloodThinners: formData.bloodThinners,
                  bloodThinnersDetails: formData.bloodThinnersDetails,
                  allergies: formData.allergies,
                  allergyDetails: formData.allergyDetails,
                  pregnant: formData.pregnant,
                  jointInfection: formData.jointInfection,
                  jointInfectionDetails: formData.jointInfectionDetails,
                  skinCondition: formData.skinCondition,
                  skinConditionDetails: formData.skinConditionDetails,
                  prosthetic: formData.prosthetic,
                  prostheticDetails: formData.prostheticDetails,
                  bleedingDisorder: formData.bleedingDisorder,
                  bleedingDisorderDetails: formData.bleedingDisorderDetails,
                },
                acknowledgments: formData.acknowledgments
              }
            })
          });
        } catch (dbErr) { console.error('DB save error:', dbErr); }

        // Sync to GHL
        try {
          await fetch(CONSENT_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              consentType: 'knee-aspiration',
              firstName: formData.firstName,
              lastName: formData.lastName,
              email: formData.email,
              phone: formData.phone,
              dateOfBirth: formData.dateOfBirth,
              consentDate: formData.consentDate,
              pdfUrl: pdfUrl,
              signatureUrl: signatureUrl,
              ghlContactId: ghlContactId,
              healthScreening: {
                bloodThinners: formData.bloodThinners,
                jointInfection: formData.jointInfection,
                bleedingDisorder: formData.bleedingDisorder,
                prosthetic: formData.prosthetic
              }
            })
          });
        } catch (ghlErr) {
          console.error('GHL sync error:', ghlErr);
        }

        // Success
        showThankYouPage(formData);

      } catch (err) {
        console.error('Submission error:', err);
        statusMsg.textContent = 'Error submitting form. Please try again.';
        statusMsg.className = 'status-message error';
        statusMsg.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Consent';
      }
    });

    // ============================================
    // HELPER: dataURL to Blob
    // ============================================
    function dataURLtoBlob(dataurl) {
      const arr = dataurl.split(',');
      const mime = arr[0].match(/:(.*?);/)[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) u8arr[n] = bstr.charCodeAt(n);
      return new Blob([u8arr], { type: mime });
    }

    // ============================================
    // CONDITIONAL FIELDS
    // ============================================
    document.querySelectorAll('.screening-radio').forEach(radio => {
      radio.addEventListener('change', function() {
        const detailsEl = document.getElementById(this.name + '-details');
        if (detailsEl) {
          detailsEl.style.display = (this.value === 'Yes' || this.value === 'Unsure') ? 'block' : 'none';
        }
      });
    });

    // ============================================
    // THANK YOU PAGE
    // ============================================
    function showThankYouPage(formData) {
      const bundleToken = urlParams.get('bundle');
      if (bundleToken) { window.location.href = '/forms/' + bundleToken; return; }
      document.getElementById('consentContainer').innerHTML = `
        <div class="thank-you-page">
          <div class="thank-you-icon">\u2713</div>
          <h1>Thank You, ${formData.firstName}!</h1>
          <p class="thank-you-subtitle">Your form has been sent.</p>
          <div class="thank-you-details">
            <p>We received your Knee Aspiration (Joint Drainage) consent form.</p>
            <p>Our team will review it before your procedure.</p>
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

    // ============================================
    // GENERATE PDF — ALL CONTENT INCLUDED
    // ============================================
    async function generatePDF(formData) {
      let jsPDF;
      if (window.jspdf && window.jspdf.jsPDF) {
        jsPDF = window.jspdf.jsPDF;
      } else if (window.jsPDF) {
        jsPDF = window.jsPDF;
      } else {
        throw new Error('jsPDF not loaded');
      }

      const doc = new jsPDF({ compress: true });
      let yPos = 15;
      const leftMargin = 15;
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const contentWidth = pageWidth - 30;

      function checkPageBreak(needed = 20) {
        if (yPos + needed > pageHeight - 25) {
          doc.addPage();
          yPos = 15;
          addFooter();
        }
      }

      function addFooter() {
        doc.setFontSize(7);
        doc.setTextColor(130);
        doc.text('Range Medical | 1901 Westcliff Dr, Suite 10, Newport Beach, CA 92660 | (949) 997-3988', pageWidth / 2, pageHeight - 8, { align: 'center' });
        doc.text('CONFIDENTIAL \u2014 Knee Aspiration Consent', pageWidth / 2, pageHeight - 4, { align: 'center' });
        doc.setTextColor(0);
      }

      function addText(text, fontSize = 9, isBold = false, color = [0, 0, 0]) {
        doc.setFontSize(fontSize);
        doc.setFont('helvetica', isBold ? 'bold' : 'normal');
        doc.setTextColor(...color);
        const lines = doc.splitTextToSize(text, contentWidth);
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

      const patientInitials = ((formData.firstName || '').charAt(0) + (formData.lastName || '').charAt(0)).toUpperCase();

      function addCheckboxLine(text, isChecked = true) {
        const lines = doc.splitTextToSize(text, contentWidth - 10);
        checkPageBreak(lines.length * 4.5 + 3);
        doc.setDrawColor(0);
        if (isChecked) {
          doc.setFillColor(0, 0, 0);
          doc.rect(leftMargin, yPos - 3, 5, 5, 'FD');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(6);
          doc.setTextColor(255, 255, 255);
          doc.text(patientInitials, leftMargin + 2.5, yPos + 0.5, { align: 'center' });
          doc.setTextColor(0, 0, 0);
        } else {
          doc.rect(leftMargin, yPos - 3, 5, 5);
        }
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text(lines, leftMargin + 8, yPos);
        yPos += lines.length * 4 + 2;
      }

      // ========== HEADER ==========
      doc.setFillColor(0, 0, 0);
      doc.rect(0, 0, pageWidth, 22, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('RANGE MEDICAL', leftMargin, 10);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('Knee Aspiration (Joint Drainage) \u2014 Informed Consent', leftMargin, 16);
      doc.setFontSize(8);
      doc.text(`Document Date: ${formData.consentDate}`, pageWidth - 15, 10, { align: 'right' });
      doc.text('1901 Westcliff Dr, Suite 10, Newport Beach, CA 92660', pageWidth - 15, 16, { align: 'right' });
      doc.setTextColor(0, 0, 0);
      yPos = 28;

      // ========== PATIENT INFORMATION ==========
      addSectionHeader('Patient Information');
      addLabelValue('Patient Name: ', `${formData.firstName} ${formData.lastName}`);
      addLabelValue('Date of Birth: ', formData.dateOfBirth);
      addLabelValue('Email: ', formData.email);
      addLabelValue('Phone: ', formData.phone);
      addLabelValue('Consent Date: ', formData.consentDate);
      yPos += 2;

      // ========== PROCEDURE DESCRIPTION ==========
      addSectionHeader('Description of Knee Aspiration');
      addText('Knee aspiration (arthrocentesis) is a procedure in which a sterile needle is inserted into the knee joint space to withdraw excess fluid. The procedure is performed to relieve pressure, reduce pain and swelling, and/or to obtain a fluid sample for diagnostic analysis.', 8.5);
      yPos += 2;
      addText('The procedure area will be cleaned with antiseptic solution and may be numbed with a local anesthetic. Using sterile technique, a needle will be inserted into the joint space to aspirate (drain) the accumulated fluid. In some cases, a corticosteroid or other therapeutic agent may be injected into the joint after drainage to reduce inflammation.', 8.5);
      yPos += 2;
      addText('Knee aspiration performed by Range Medical is classified as an elective medical procedure and is performed for symptomatic relief and/or diagnostic purposes.', 8.5);
      yPos += 2;

      // ========== HEALTH SCREENING ==========
      addSectionHeader('Health Screening Responses');
      const screeningItems = [
        { label: 'Blood Thinners / Anticoagulants', value: formData.bloodThinners, details: formData.bloodThinnersDetails },
        { label: 'Allergies (medications, anesthetics, antiseptics)', value: formData.allergies, details: formData.allergyDetails },
        { label: 'Pregnant or Nursing', value: formData.pregnant, details: '' },
        { label: 'Active Joint Infection / Fever', value: formData.jointInfection, details: formData.jointInfectionDetails },
        { label: 'Skin Condition Over Knee', value: formData.skinCondition, details: formData.skinConditionDetails },
        { label: 'Prosthetic Knee Joint', value: formData.prosthetic, details: formData.prostheticDetails },
        { label: 'Bleeding Disorder', value: formData.bleedingDisorder, details: formData.bleedingDisorderDetails },
      ];
      screeningItems.forEach(item => {
        let val = item.value || 'Not answered';
        if (item.details) val += ` \u2014 ${item.details}`;
        addLabelValue(`${item.label}: `, val);
      });
      yPos += 2;

      // ========== RISKS AND POTENTIAL COMPLICATIONS ==========
      addSectionHeader('Risks & Potential Complications');
      addText('The following risks and potential complications have been disclosed to the patient. Knee aspiration, while generally safe when performed with proper sterile technique, carries inherent medical risks including but not limited to:', 8.5);
      yPos += 1;
      const risks = [
        'Pain, swelling, or bruising at the aspiration site',
        'Infection of the knee joint (septic arthritis)',
        'Bleeding into the joint space (hemarthrosis)',
        'Injury to cartilage, tendons, or other structures within or around the knee',
        'Nerve irritation or injury near the aspiration site',
        'Allergic reaction to local anesthetic, antiseptic, or injected medication',
        'Temporary increase in pain or inflammation following the procedure',
        'Re-accumulation of fluid in the joint',
        'Vasovagal response (lightheadedness, dizziness, nausea, or fainting)',
        'Failure to achieve desired diagnostic or therapeutic result',
        'Unforeseen complications or side effects not listed above'
      ];
      risks.forEach(r => {
        checkPageBreak(8);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        const lines = doc.splitTextToSize(`\u2022 ${r}`, contentWidth - 5);
        doc.text(lines, leftMargin + 3, yPos);
        yPos += lines.length * 3.8 + 1;
      });
      yPos += 2;

      // ========== PATIENT ACKNOWLEDGMENTS ==========
      addSectionHeader('Patient Acknowledgments & Agreement');
      addText('By signing below, the patient affirms that each of the following statements has been read, understood, and individually acknowledged:', 8.5);
      yPos += 3;

      if (formData.acknowledgments && formData.acknowledgments.length > 0) {
        formData.acknowledgments.forEach(ack => {
          addCheckboxLine(ack.text, ack.checked);
        });
      }
      yPos += 4;

      // ========== SIGNATURE ==========
      addSectionHeader('Patient Signature');
      addText('By affixing my signature below, I certify that I have read this consent form in its entirety, that all of my questions have been answered to my satisfaction, and that I voluntarily consent to the knee aspiration procedure described herein.', 8.5);
      yPos += 3;
      addLabelValue('Signed by: ', `${formData.firstName} ${formData.lastName}`);
      addLabelValue('Date: ', formData.consentDate);
      yPos += 2;

      // Signature image
      if (formData.signatureData && formData.signatureData.startsWith('data:')) {
        checkPageBreak(35);
        try {
          doc.addImage(formData.signatureData, 'PNG', leftMargin, yPos, 60, 25);
          yPos += 28;
        } catch (e) {
          console.error('Error adding signature:', e);
        }
      }

      // Footer on all pages
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(130);
        doc.text(`Page ${i} of ${totalPages}`, pageWidth - 15, pageHeight - 4, { align: 'right' });
        doc.text('Range Medical | 1901 Westcliff Dr, Suite 10, Newport Beach, CA 92660 | (949) 997-3988', pageWidth / 2, pageHeight - 8, { align: 'center' });
        doc.text('CONFIDENTIAL \u2014 Knee Aspiration Informed Consent', pageWidth / 2, pageHeight - 4, { align: 'center' });
      }

      return doc.output('blob');
    }

  }, []);

  return (
    <>
      <Head>
        <title>Knee Aspiration Consent | Range Medical</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
        <script src="https://cdn.jsdelivr.net/npm/signature_pad@4.0.0/dist/signature_pad.umd.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
      </Head>

      <div id="consentContainer" className="consent-page">
        <header className="consent-header">
          <div className="header-inner">
            <h1>RANGE MEDICAL</h1>
            <p>Knee Aspiration (Joint Drainage) — Informed Consent</p>
          </div>
        </header>

        <form id="consentForm" className="consent-form">
          {/* ===== PATIENT INFORMATION ===== */}
          <div className="section">
            <h2 className="section-title">Patient Information</h2>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">First Name <span className="req">*</span></label>
                <input type="text" id="firstName" name="firstName" autoComplete="given-name" required />
              </div>
              <div className="form-group">
                <label htmlFor="lastName">Last Name <span className="req">*</span></label>
                <input type="text" id="lastName" name="lastName" autoComplete="family-name" required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="email">Email <span className="req">*</span></label>
                <input type="email" id="email" name="email" autoComplete="email" required />
              </div>
              <div className="form-group">
                <label htmlFor="phone">Phone <span className="req">*</span></label>
                <input type="tel" id="phone" name="phone" autoComplete="tel" required />
                <p style={{ fontSize: '0.6rem', color: '#a3a3a3', lineHeight: 1.4, marginTop: '0.25rem' }}>By providing my phone number, I agree to receive texts from Range Medical. Msg &amp; data rates may apply. Up to 10 msg/mo. Reply STOP to opt out. <a href="/terms-of-use" target="_blank" rel="noopener noreferrer" style={{ color: '#a3a3a3', textDecoration: 'underline' }}>Terms</a> &amp; <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" style={{ color: '#a3a3a3', textDecoration: 'underline' }}>Privacy</a>.</p>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="dateOfBirth">Date of Birth <span className="req">*</span></label>
                <input type="text" id="dateOfBirth" name="dateOfBirth" autoComplete="bday" placeholder="MM/DD/YYYY" maxLength="10" required />
              </div>
            </div>
          </div>

          {/* ===== PROCEDURE DESCRIPTION ===== */}
          <div className="section">
            <h2 className="section-title">Description of Knee Aspiration</h2>
            <div className="info-block">
              <p>Knee aspiration (arthrocentesis) is a procedure in which a sterile needle is inserted into the knee joint space to withdraw excess fluid. The procedure is performed to relieve pressure, reduce pain and swelling, and/or to obtain a fluid sample for diagnostic analysis.</p>
              <p>The procedure area will be cleaned with antiseptic solution and may be numbed with a local anesthetic. Using sterile technique, a needle will be inserted into the joint space to aspirate (drain) the accumulated fluid. In some cases, a corticosteroid or other therapeutic agent may be injected into the joint after drainage to reduce inflammation.</p>
              <p>Knee aspiration performed by Range Medical is classified as an <strong>elective medical procedure</strong> and is performed for symptomatic relief and/or diagnostic purposes.</p>
            </div>
          </div>

          {/* ===== HEALTH SCREENING ===== */}
          <div className="section">
            <h2 className="section-title">Health Screening</h2>
            <p className="section-desc">Please answer the following questions truthfully. Incomplete or inaccurate responses may compromise the safety of your procedure.</p>

            {/* Blood Thinners */}
            <div className="screening-item critical">
              <label className="screening-label">Are you currently taking blood thinners or anticoagulants (e.g., warfarin, Eliquis, Xarelto, heparin, aspirin)? <span className="req">*</span></label>
              <p className="screening-note">Blood thinners increase the risk of bleeding into the joint. Your provider may need to adjust your medication schedule before the procedure.</p>
              <div className="radio-row">
                <label><input type="radio" name="bloodThinners" value="Yes" required className="screening-radio" /> Yes</label>
                <label><input type="radio" name="bloodThinners" value="No" className="screening-radio" /> No</label>
              </div>
              <div id="bloodThinners-details" className="details-field" style={{display:'none'}}>
                <label htmlFor="bloodThinnersDetails">Please list medications and dosages:</label>
                <textarea id="bloodThinnersDetails" rows="2"></textarea>
              </div>
            </div>

            {/* Allergies */}
            <div className="screening-item">
              <label className="screening-label">Do you have any known allergies to medications, anesthetics, antiseptics (e.g., iodine, chlorhexidine), or latex? <span className="req">*</span></label>
              <div className="radio-row">
                <label><input type="radio" name="allergies" value="Yes" required className="screening-radio" /> Yes</label>
                <label><input type="radio" name="allergies" value="No" className="screening-radio" /> No</label>
              </div>
              <div id="allergies-details" className="details-field" style={{display:'none'}}>
                <label htmlFor="allergyDetails">Please list all allergies and reactions:</label>
                <textarea id="allergyDetails" rows="2"></textarea>
              </div>
            </div>

            {/* Pregnant */}
            <div className="screening-item">
              <label className="screening-label">Are you currently pregnant or nursing? <span className="req">*</span></label>
              <div className="radio-row">
                <label><input type="radio" name="pregnant" value="Yes" required className="screening-radio" /> Yes</label>
                <label><input type="radio" name="pregnant" value="No" className="screening-radio" /> No</label>
                <label><input type="radio" name="pregnant" value="N/A" className="screening-radio" /> N/A</label>
              </div>
            </div>

            {/* Joint Infection */}
            <div className="screening-item critical">
              <label className="screening-label">Do you currently have a suspected or confirmed infection in or around the knee joint, or do you currently have a fever? <span className="req">*</span></label>
              <p className="screening-note">An active joint infection or systemic fever may be a contraindication for aspiration. Please disclose so your provider can evaluate.</p>
              <div className="radio-row">
                <label><input type="radio" name="jointInfection" value="Yes" required className="screening-radio" /> Yes</label>
                <label><input type="radio" name="jointInfection" value="No" className="screening-radio" /> No</label>
                <label><input type="radio" name="jointInfection" value="Unsure" className="screening-radio" /> Unsure</label>
              </div>
              <div id="jointInfection-details" className="details-field" style={{display:'none'}}>
                <label htmlFor="jointInfectionDetails">Please describe your symptoms:</label>
                <textarea id="jointInfectionDetails" rows="2"></textarea>
              </div>
            </div>

            {/* Skin Condition */}
            <div className="screening-item">
              <label className="screening-label">Do you have any skin condition, rash, open wound, or cellulitis over the knee area where the procedure will be performed? <span className="req">*</span></label>
              <div className="radio-row">
                <label><input type="radio" name="skinCondition" value="Yes" required className="screening-radio" /> Yes</label>
                <label><input type="radio" name="skinCondition" value="No" className="screening-radio" /> No</label>
              </div>
              <div id="skinCondition-details" className="details-field" style={{display:'none'}}>
                <label htmlFor="skinConditionDetails">Please describe:</label>
                <textarea id="skinConditionDetails" rows="2"></textarea>
              </div>
            </div>

            {/* Prosthetic Joint */}
            <div className="screening-item">
              <label className="screening-label">Do you have a prosthetic (artificial) knee joint in the knee being treated? <span className="req">*</span></label>
              <div className="radio-row">
                <label><input type="radio" name="prosthetic" value="Yes" required className="screening-radio" /> Yes</label>
                <label><input type="radio" name="prosthetic" value="No" className="screening-radio" /> No</label>
              </div>
              <div id="prosthetic-details" className="details-field" style={{display:'none'}}>
                <label htmlFor="prostheticDetails">Please provide details (type of implant, date of surgery):</label>
                <textarea id="prostheticDetails" rows="2"></textarea>
              </div>
            </div>

            {/* Bleeding Disorder */}
            <div className="screening-item">
              <label className="screening-label">Do you have a known bleeding disorder or platelet dysfunction (e.g., hemophilia, thrombocytopenia)? <span className="req">*</span></label>
              <div className="radio-row">
                <label><input type="radio" name="bleedingDisorder" value="Yes" required className="screening-radio" /> Yes</label>
                <label><input type="radio" name="bleedingDisorder" value="No" className="screening-radio" /> No</label>
                <label><input type="radio" name="bleedingDisorder" value="Unsure" className="screening-radio" /> Unsure</label>
              </div>
              <div id="bleedingDisorder-details" className="details-field" style={{display:'none'}}>
                <label htmlFor="bleedingDisorderDetails">Please provide details:</label>
                <textarea id="bleedingDisorderDetails" rows="2"></textarea>
              </div>
            </div>
          </div>

          {/* ===== RISKS & COMPLICATIONS ===== */}
          <div className="section">
            <h2 className="section-title">Risks & Potential Complications</h2>
            <div className="info-block">
              <p>Knee aspiration, while generally safe when performed with proper sterile technique, carries inherent medical risks. The following potential risks and complications have been disclosed to you:</p>
              <ul className="risk-list">
                <li>Pain, swelling, or bruising at the aspiration site</li>
                <li>Infection of the knee joint (septic arthritis)</li>
                <li>Bleeding into the joint space (hemarthrosis)</li>
                <li>Injury to cartilage, tendons, or other structures within or around the knee</li>
                <li>Nerve irritation or injury near the aspiration site</li>
                <li>Allergic reaction to local anesthetic, antiseptic, or injected medication</li>
                <li>Temporary increase in pain or inflammation following the procedure</li>
                <li>Re-accumulation of fluid in the joint</li>
                <li>Vasovagal response (lightheadedness, dizziness, nausea, or fainting)</li>
                <li>Failure to achieve desired diagnostic or therapeutic result</li>
                <li>Unforeseen complications or side effects not listed above</li>
              </ul>
            </div>
          </div>

          {/* ===== ACKNOWLEDGMENTS ===== */}
          <div className="section">
            <h2 className="section-title">Patient Acknowledgments & Agreement</h2>
            <p className="section-desc">Please read each statement carefully and check the box to confirm your understanding and agreement. <strong>All boxes must be checked to proceed.</strong></p>

            <div className="ack-item">
              <label>
                <input type="checkbox" id="ack1" className="ack-checkbox" required />
                <span className="ack-initials"></span>
                <span className="ack-text">I understand that knee aspiration (arthrocentesis) is a medical procedure that involves inserting a needle into my knee joint to remove excess fluid. The procedure has been explained to me, including the reasons it is being recommended, the technique that will be used, and what I should expect during and after the procedure.</span>
              </label>
            </div>

            <div className="ack-item">
              <label>
                <input type="checkbox" id="ack2" className="ack-checkbox" required />
                <span className="ack-initials"></span>
                <span className="ack-text">I have been informed of the risks and potential complications associated with knee aspiration, as detailed in the Risks & Potential Complications section above. I accept these risks voluntarily and understand that complications may occur even when all procedures are performed correctly.</span>
              </label>
            </div>

            <div className="ack-item">
              <label>
                <input type="checkbox" id="ack3" className="ack-checkbox" required />
                <span className="ack-initials"></span>
                <span className="ack-text">I confirm that I have disclosed all relevant medical history, current medications (including over-the-counter drugs, supplements, and blood thinners), known allergies, and pre-existing health conditions to Range Medical staff. I understand that failure to disclose accurate and complete medical information may compromise the safety of my procedure.</span>
              </label>
            </div>

            <div className="ack-item">
              <label>
                <input type="checkbox" id="ack4" className="ack-checkbox" required />
                <span className="ack-initials"></span>
                <span className="ack-text">I understand that fluid removed from my joint may be sent for laboratory analysis if deemed clinically appropriate by my provider. I consent to such testing and understand that results will be shared with me and become part of my medical record.</span>
              </label>
            </div>

            <div className="ack-item">
              <label>
                <input type="checkbox" id="ack5" className="ack-checkbox" required />
                <span className="ack-initials"></span>
                <span className="ack-text">I understand that in some cases a medication (such as a corticosteroid) may be injected into the joint after drainage. My provider has discussed whether this applies to my procedure and I consent to such injection if recommended.</span>
              </label>
            </div>

            <div className="ack-item">
              <label>
                <input type="checkbox" id="ack6" className="ack-checkbox" required />
                <span className="ack-initials"></span>
                <span className="ack-text">I understand that knee aspiration may provide temporary relief and that fluid may re-accumulate over time. Additional procedures or treatments may be necessary depending on the underlying cause of the fluid accumulation.</span>
              </label>
            </div>

            <div className="ack-item">
              <label>
                <input type="checkbox" id="ack7" className="ack-checkbox" required />
                <span className="ack-initials"></span>
                <span className="ack-text">I agree to follow all post-procedure instructions provided by Range Medical, including keeping the site clean and dry, monitoring for signs of infection (increased redness, warmth, swelling, fever, or drainage), and contacting the clinic immediately if any concerning symptoms develop.</span>
              </label>
            </div>

            <div className="ack-item">
              <label>
                <input type="checkbox" id="ack8" className="ack-checkbox" required />
                <span className="ack-initials"></span>
                <span className="ack-text">I understand that I have the right to refuse or discontinue treatment at any time without penalty. I acknowledge that refusing or discontinuing treatment may affect the anticipated outcome.</span>
              </label>
            </div>

            <div className="ack-item">
              <label>
                <input type="checkbox" id="ack9" className="ack-checkbox" required />
                <span className="ack-initials"></span>
                <span className="ack-text">I acknowledge that I am financially responsible for all services rendered. I understand that knee aspiration services may not be covered by health insurance, and that payment is due at the time of service. Refunds are not provided for completed procedures.</span>
              </label>
            </div>

            <div className="ack-item">
              <label>
                <input type="checkbox" id="ack10" className="ack-checkbox" required />
                <span className="ack-initials"></span>
                <span className="ack-text">I confirm that I am at least 18 years of age (or that the consent of a parent/legal guardian has been obtained), that I have read this consent form in its entirety, that I have had the opportunity to ask questions, and that I am signing this form voluntarily and of my own free will.</span>
              </label>
            </div>
          </div>

          {/* ===== SIGNATURE ===== */}
          <div className="section">
            <h2 className="section-title">Patient Signature</h2>
            <p className="section-desc">By signing below, I certify that I have read, understood, and agree to all statements contained in this Informed Consent for Knee Aspiration.</p>
            <div className="signature-container">
              <canvas id="signaturePad" className="signature-pad"></canvas>
            </div>
            <div className="signature-actions">
              <button type="button" className="btn-clear" id="clearSignature">Clear Signature</button>
            </div>
            <span className="field-error" id="signatureError" style={{display:'none'}}>Signature is required</span>
          </div>

          <div className="submit-section">
            <div className="validation-summary" id="validationSummary">
              <h3>Please complete the following required fields:</h3>
              <ul id="validationList"></ul>
            </div>
            <button type="submit" className="btn-submit" id="submitBtn">Submit Consent</button>
            <div className="status-message" id="statusMessage" style={{display:'none'}}></div>
          </div>
        </form>

        <footer className="consent-footer">
          <p>&copy; 2026 Range Medical. All rights reserved.</p>
          <p>Your information is protected and kept confidential.</p>
        </footer>
      </div>

      <style jsx global>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; background: #f9f9f9; color: #111; }
        .consent-page { max-width: 720px; margin: 0 auto; background: #fff; min-height: 100vh; }
        .consent-header { background: #000; color: #fff; padding: 24px 28px; }
        .consent-header h1 { font-size: 22px; font-weight: 700; letter-spacing: 2px; margin-bottom: 4px; color: #fff; }
        .consent-header p { font-size: 14px; opacity: 0.85; color: #fff; }
        .consent-form { padding: 0 28px 40px; }
        .section { border-bottom: 1px solid #e5e5e5; padding: 28px 0; }
        .section:last-of-type { border-bottom: none; }
        .section-title { font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid #000; }
        .section-desc { font-size: 14px; color: #444; margin-bottom: 16px; line-height: 1.5; }
        .form-row { display: flex; gap: 16px; margin-bottom: 16px; }
        .form-group { flex: 1; }
        .form-group label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 4px; color: #333; }
        .form-group input, .form-group textarea, .form-group select { width: 100%; padding: 10px 12px; border: 1px solid #ccc; border-radius: 0; font-size: 14px; background: #fff; }
        .form-group input:focus, .form-group textarea:focus { border-color: #000; outline: none; box-shadow: 0 0 0 2px rgba(0,0,0,0.1); }
        .req { color: #dc2626; }
        .info-block { background: #fafafa; border: 1px solid #e5e5e5; border-radius: 0; padding: 20px; }
        .info-block p { font-size: 14px; line-height: 1.6; color: #333; margin-bottom: 12px; }
        .info-block p:last-child { margin-bottom: 0; }
        .risk-list { padding-left: 20px; margin-top: 8px; }
        .risk-list li { font-size: 13px; line-height: 1.5; color: #444; margin-bottom: 6px; }
        .screening-item { background: #fafafa; border: 1px solid #e5e5e5; border-radius: 0; padding: 16px; margin-bottom: 12px; }
        .screening-item.critical { background: #fef2f2; border-color: #fecaca; }
        .screening-label { font-size: 14px; font-weight: 600; display: block; margin-bottom: 6px; }
        .screening-note { font-size: 12px; color: #b91c1c; font-style: italic; margin-bottom: 8px; }
        .radio-row { display: flex; gap: 20px; margin-top: 4px; }
        .radio-row label { font-size: 14px; cursor: pointer; display: flex; align-items: center; gap: 6px; }
        .details-field { margin-top: 10px; }
        .details-field label { font-size: 13px; font-weight: 500; display: block; margin-bottom: 4px; }
        .details-field textarea { width: 100%; padding: 8px 10px; border: 1px solid #ccc; border-radius: 0; font-size: 13px; resize: vertical; }
        .ack-item { border: 1px solid #e5e7eb; border-radius: 0; padding: 14px 16px; margin-bottom: 10px; transition: border-color 0.2s; }
        .ack-item:hover { border-color: #999; }
        .ack-item label { display: flex; gap: 12px; cursor: pointer; align-items: flex-start; }
        .ack-checkbox { position: absolute; opacity: 0; width: 0; height: 0; }
        .ack-initials { width: 28px; height: 28px; min-width: 28px; border: 2px solid #d4d4d4; border-radius: 0; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; color: transparent; background: #fff; cursor: pointer; transition: all 0.15s; margin-top: 1px; user-select: none; }
        .ack-checkbox:checked + .ack-initials { background: #000; border-color: #000; color: #fff; }
        .ack-text { font-size: 13px; line-height: 1.55; color: #333; }
        .signature-container { border: 2px solid #000; border-radius: 0; margin-bottom: 8px; overflow: hidden; background: #fff; }
        .signature-pad { width: 100%; height: 150px; cursor: crosshair; }
        .signature-actions { text-align: right; }
        .btn-clear { background: none; border: 1px solid #ccc; padding: 6px 14px; border-radius: 0; cursor: pointer; font-size: 13px; }
        .btn-clear:hover { background: #f5f5f5; }
        .field-error { color: #dc2626; font-size: 12px; display: block; margin-top: 4px; }
        .submit-section { padding-top: 20px; text-align: center; }
        .btn-submit { background: #000; color: #fff; border: none; padding: 14px 48px; font-size: 16px; font-weight: 600; border-radius: 0; cursor: pointer; letter-spacing: 0.5px; }
        .btn-submit:hover { background: #222; }
        .btn-submit:disabled { background: #999; cursor: not-allowed; }
        .validation-summary{background:#fef2f2;border:1px solid #fecaca;border-radius: 0;padding:1rem 1.5rem;margin-bottom:1rem;display:none}
        .validation-summary.visible{display:block}
        .validation-summary h3{color:#991b1b;font-size:.9375rem;margin-bottom:.5rem}
        .validation-summary ul{margin:0;padding-left:1.25rem;color:#dc2626;font-size:.875rem}
        .validation-summary ul li{margin-bottom:.25rem}
        .status-message { margin-top: 16px; padding: 12px; border-radius: 0; font-size: 14px; text-align: center; }
        .status-message.success { background: #f0fdf4; color: #15803d; border: 1px solid #86efac; }
        .status-message.error { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
        .consent-footer { text-align: center; padding: 20px; border-top: 1px solid #e5e5e5; font-size: 12px; color: #999; }
        .consent-footer p { margin-bottom: 4px; }
        .thank-you-page { background: #fff; border: 2px solid #000; padding: 3rem 2rem; text-align: center; max-width: 720px; margin: 40px auto; }
        .thank-you-icon { width: 80px; height: 80px; background: #000; color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 3rem; margin: 0 auto 2rem; }
        .thank-you-page h1 { font-size: 2rem; font-weight: 700; margin-bottom: 1rem; color: #000; }
        .thank-you-subtitle { font-size: 1.125rem; color: #525252; margin-bottom: 2rem; }
        .thank-you-details { padding: 2rem; background: #fafafa; border: 1.5px solid #e5e5e5; margin-bottom: 2rem; }
        .thank-you-details p { margin-bottom: 0.75rem; color: #404040; }
        .thank-you-contact { margin-bottom: 2rem; }
        .thank-you-contact h3 { font-size: 1rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem; color: #262626; }
        .thank-you-contact a { color: #000; text-decoration: underline; }
        .thank-you-footer { padding-top: 2rem; border-top: 2px solid #e5e5e5; }
        .thank-you-footer p { font-size: 1.5rem; font-weight: 700; letter-spacing: 0.15em; color: #000; }
        @media (max-width: 640px) {
          .form-row { flex-direction: column; gap: 12px; }
          .consent-form { padding: 0 16px 30px; }
          .consent-header { padding: 20px 16px; }
          .radio-row { flex-wrap: wrap; gap: 12px; }
        }
      `}</style>
    </>
  );
}
