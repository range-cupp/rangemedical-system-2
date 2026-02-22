// pages/consent/iv.js
// IV & Injection Therapy Consent Form
// Range Medical — Professional Consent with Full PDF Generation
// All acknowledgments appear individually on the generated PDF

import Head from 'next/head';
import { useEffect } from 'react';

export default function IVConsentPage() {
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
        { name: 'g6pd', label: 'G6PD deficiency question' },
        { name: 'allergies', label: 'Allergies question' },
        { name: 'pregnant', label: 'Pregnant/nursing question' },
        { name: 'medications', label: 'Medications question' },
        { name: 'heartCondition', label: 'Heart condition question' },
        { name: 'kidneyLiver', label: 'Kidney/liver question' },
        { name: 'diabetes', label: 'Diabetes question' },
        { name: 'bleeding', label: 'Bleeding disorder question' },
        { name: 'recentSurgery', label: 'Recent surgery question' }
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
          g6pd: getRadio('g6pd'),
          g6pdDetails: getValue('g6pdDetails'),
          allergies: getRadio('allergies'),
          allergyDetails: getValue('allergyDetails'),
          pregnant: getRadio('pregnant'),
          medications: getRadio('medications'),
          medicationDetails: getValue('medicationDetails'),
          heartCondition: getRadio('heartCondition'),
          heartDetails: getValue('heartDetails'),
          kidneyLiver: getRadio('kidneyLiver'),
          kidneyLiverDetails: getValue('kidneyLiverDetails'),
          diabetes: getRadio('diabetes'),
          diabetesDetails: getValue('diabetesDetails'),
          bleeding: getRadio('bleeding'),
          bleedingDetails: getValue('bleedingDetails'),
          recentSurgery: getRadio('recentSurgery'),
          surgeryDetails: getValue('surgeryDetails'),
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
        const pdfFileName = `iv-injection-consent-${formData.firstName}-${formData.lastName}-${Date.now()}.pdf`;
        const { data: pdfData, error: pdfError } = await supabaseClient.storage
          .from('medical-documents')
          .upload(`consents/${pdfFileName}`, pdfBlob, { contentType: 'application/pdf' });

        const pdfUrl = pdfError ? '' :
          `${SUPABASE_URL}/storage/v1/object/public/medical-documents/consents/${pdfFileName}`;

        // Save to database
        const { error: dbError } = await supabaseClient.from('consents').insert({
          consent_type: 'iv-injection',
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          date_of_birth: formData.dateOfBirth || null,
          consent_date: new Date().toISOString().split('T')[0],
          consent_given: true,
          signature_url: signatureUrl,
          pdf_url: pdfUrl,
          additional_data: {
            ghl_contact_id: ghlContactId,
            health_screening: {
              g6pd: formData.g6pd,
              g6pdDetails: formData.g6pdDetails,
              allergies: formData.allergies,
              allergyDetails: formData.allergyDetails,
              pregnant: formData.pregnant,
              medications: formData.medications,
              medicationDetails: formData.medicationDetails,
              heartCondition: formData.heartCondition,
              heartDetails: formData.heartDetails,
              kidneyLiver: formData.kidneyLiver,
              kidneyLiverDetails: formData.kidneyLiverDetails,
              diabetes: formData.diabetes,
              diabetesDetails: formData.diabetesDetails,
              bleeding: formData.bleeding,
              bleedingDetails: formData.bleedingDetails,
              recentSurgery: formData.recentSurgery,
              surgeryDetails: formData.surgeryDetails,
              g6pdCritical: formData.g6pd === 'Yes' || formData.g6pd === 'Unsure'
            },
            acknowledgments: formData.acknowledgments
          }
        });

        if (dbError) console.error('DB save error:', dbError);

        // Sync to GHL
        try {
          await fetch(CONSENT_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              consentType: 'iv',
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
                g6pd: formData.g6pd,
                g6pdDetails: formData.g6pdDetails,
                g6pdCritical: formData.g6pd === 'Yes' || formData.g6pd === 'Unsure'
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
      document.getElementById('consentContainer').innerHTML = `
        <div class="thank-you-page">
          <div class="thank-you-icon">✓</div>
          <h1>Thank You, ${formData.firstName}!</h1>
          <p class="thank-you-subtitle">Your form has been sent.</p>
          <div class="thank-you-details">
            <p>We received your IV & Injection Therapy consent form.</p>
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
        doc.text('CONFIDENTIAL — IV & Injection Therapy Consent', pageWidth / 2, pageHeight - 4, { align: 'center' });
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
      doc.text('IV & Injection Therapy — Informed Consent', leftMargin, 16);
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

      // ========== TREATMENT DESCRIPTION ==========
      addSectionHeader('Description of IV & Injection Therapy');
      addText('Intravenous (IV) therapy involves the administration of fluids, vitamins, minerals, amino acids, and other therapeutic substances directly into the bloodstream through a peripheral venous catheter. Injection therapy involves the intramuscular (IM) or subcutaneous (SubQ) administration of vitamins, peptides, medications, or other therapeutic agents.', 8.5);
      yPos += 2;
      addText('These therapies are provided for wellness optimization, nutrient repletion, hydration support, immune function, athletic recovery, and general well-being. IV and injection therapies offered by Range Medical are classified as elective wellness services and are not intended to diagnose, treat, cure, or prevent any disease.', 8.5);
      yPos += 2;

      // ========== HEALTH SCREENING ==========
      addSectionHeader('Health Screening Responses');
      const screeningItems = [
        { label: 'G6PD Deficiency', value: formData.g6pd, details: formData.g6pdDetails },
        { label: 'Known Allergies', value: formData.allergies, details: formData.allergyDetails },
        { label: 'Pregnant or Nursing', value: formData.pregnant, details: '' },
        { label: 'Current Medications', value: formData.medications, details: formData.medicationDetails },
        { label: 'Heart Condition', value: formData.heartCondition, details: formData.heartDetails },
        { label: 'Kidney/Liver Disease', value: formData.kidneyLiver, details: formData.kidneyLiverDetails },
        { label: 'Diabetes', value: formData.diabetes, details: formData.diabetesDetails },
        { label: 'Bleeding Disorder', value: formData.bleeding, details: formData.bleedingDetails },
        { label: 'Recent Surgery (past 30 days)', value: formData.recentSurgery, details: formData.surgeryDetails },
      ];
      screeningItems.forEach(item => {
        let val = item.value || 'Not answered';
        if (item.details) val += ` — ${item.details}`;
        addLabelValue(`${item.label}: `, val);
      });

      // G6PD Alert
      if (formData.g6pd === 'Yes' || formData.g6pd === 'Unsure') {
        yPos += 2;
        doc.setFillColor(254, 226, 226);
        doc.rect(leftMargin, yPos - 4, contentWidth, 12, 'F');
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(185, 28, 28);
        doc.text('⚠ G6PD ALERT: Patient reported G6PD deficiency or uncertain status. High-dose Vitamin C IV is contraindicated. Staff must confirm G6PD status via lab work before administering any Vitamin C-containing IV formulations.', leftMargin + 3, yPos, { maxWidth: contentWidth - 6 });
        doc.setTextColor(0, 0, 0);
        yPos += 14;
      }
      yPos += 2;

      // ========== RISKS AND POTENTIAL COMPLICATIONS ==========
      addSectionHeader('Risks & Potential Complications');
      addText('The following risks and potential complications have been disclosed to the patient. IV and injection therapy, while generally well-tolerated, carries inherent medical risks including but not limited to:', 8.5);
      yPos += 1;
      const risks = [
        'Pain, bruising, swelling, redness, or tenderness at the injection or IV insertion site',
        'Infiltration or extravasation (leakage of fluid into surrounding tissue)',
        'Phlebitis (inflammation of the vein), thrombophlebitis, or localized infection',
        'Hematoma formation at the venipuncture site',
        'Allergic or hypersensitivity reactions to administered substances, including anaphylaxis in rare cases',
        'Vasovagal response (lightheadedness, dizziness, nausea, or fainting)',
        'Air embolism (extremely rare with standard protocols)',
        'Nerve irritation or injury near the injection site',
        'Fluid overload, electrolyte imbalance, or alterations in blood chemistry',
        'Hemolytic crisis in patients with undiagnosed or undisclosed G6PD deficiency receiving high-dose Vitamin C',
        'Adverse drug interactions with current medications or supplements',
        'Cardiac arrhythmia associated with rapid electrolyte infusion (rare)',
        'Systemic infection or sepsis if sterile technique is compromised (extremely rare)',
        'Unforeseen complications or side effects not listed above'
      ];
      risks.forEach(r => {
        checkPageBreak(8);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        const lines = doc.splitTextToSize(`• ${r}`, contentWidth - 5);
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
      addText('By affixing my signature below, I certify that I have read this consent form in its entirety, that all of my questions have been answered to my satisfaction, and that I voluntarily consent to the IV and/or injection therapy services described herein.', 8.5);
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
        doc.text('CONFIDENTIAL — IV & Injection Therapy Informed Consent', pageWidth / 2, pageHeight - 4, { align: 'center' });
      }

      return doc.output('blob');
    }

  }, []);

  return (
    <>
      <Head>
        <title>IV & Injection Therapy Consent | Range Medical</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
        <script src="https://cdn.jsdelivr.net/npm/signature_pad@4.0.0/dist/signature_pad.umd.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
      </Head>

      <div id="consentContainer" className="consent-page">
        <header className="consent-header">
          <div className="header-inner">
            <h1>RANGE MEDICAL</h1>
            <p>IV & Injection Therapy — Informed Consent</p>
          </div>
        </header>

        <form id="consentForm" className="consent-form">
          {/* ===== PATIENT INFORMATION ===== */}
          <div className="section">
            <h2 className="section-title">Patient Information</h2>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">First Name <span className="req">*</span></label>
                <input type="text" id="firstName" name="firstName" required />
              </div>
              <div className="form-group">
                <label htmlFor="lastName">Last Name <span className="req">*</span></label>
                <input type="text" id="lastName" name="lastName" required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="email">Email <span className="req">*</span></label>
                <input type="email" id="email" name="email" required />
              </div>
              <div className="form-group">
                <label htmlFor="phone">Phone <span className="req">*</span></label>
                <input type="tel" id="phone" name="phone" required />
                <p style={{ fontSize: '0.6rem', color: '#a3a3a3', lineHeight: 1.4, marginTop: '0.25rem' }}>By providing my phone number, I agree to receive texts from Range Medical. Msg &amp; data rates may apply. Up to 10 msg/mo. Reply STOP to opt out. <a href="/terms-of-use" target="_blank" rel="noopener noreferrer" style={{ color: '#a3a3a3', textDecoration: 'underline' }}>Terms</a> &amp; <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" style={{ color: '#a3a3a3', textDecoration: 'underline' }}>Privacy</a>.</p>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="dateOfBirth">Date of Birth <span className="req">*</span></label>
                <input type="text" id="dateOfBirth" name="dateOfBirth" placeholder="MM/DD/YYYY" maxLength="10" required />
              </div>
            </div>
          </div>

          {/* ===== TREATMENT DESCRIPTION ===== */}
          <div className="section">
            <h2 className="section-title">Description of IV & Injection Therapy</h2>
            <div className="info-block">
              <p>Intravenous (IV) therapy involves the administration of fluids, vitamins, minerals, amino acids, and other therapeutic substances directly into the bloodstream through a peripheral venous catheter. Injection therapy involves the intramuscular (IM) or subcutaneous (SubQ) administration of vitamins, peptides, medications, or other therapeutic agents.</p>
              <p>These therapies are provided for wellness optimization, nutrient repletion, hydration support, immune function, athletic recovery, and general well-being. IV and injection therapies offered by Range Medical are classified as <strong>elective wellness services</strong> and are not intended to diagnose, treat, cure, or prevent any disease.</p>
            </div>
          </div>

          {/* ===== HEALTH SCREENING ===== */}
          <div className="section">
            <h2 className="section-title">Health Screening</h2>
            <p className="section-desc">Please answer the following questions truthfully. Incomplete or inaccurate responses may compromise the safety of your treatment.</p>

            {/* G6PD */}
            <div className="screening-item critical">
              <label className="screening-label">Do you have G6PD (Glucose-6-Phosphate Dehydrogenase) deficiency? <span className="req">*</span></label>
              <p className="screening-note">This is critical for your safety. High-dose Vitamin C is contraindicated in patients with G6PD deficiency and may cause a life-threatening hemolytic crisis.</p>
              <div className="radio-row">
                <label><input type="radio" name="g6pd" value="Yes" required className="screening-radio" /> Yes</label>
                <label><input type="radio" name="g6pd" value="No" className="screening-radio" /> No</label>
                <label><input type="radio" name="g6pd" value="Unsure" className="screening-radio" /> Unsure</label>
              </div>
              <div id="g6pd-details" className="details-field" style={{display:'none'}}>
                <label htmlFor="g6pdDetails">Please provide details:</label>
                <textarea id="g6pdDetails" rows="2"></textarea>
              </div>
            </div>

            {/* Allergies */}
            <div className="screening-item">
              <label className="screening-label">Do you have any known allergies to medications, vitamins, minerals, foods, latex, or adhesives? <span className="req">*</span></label>
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

            {/* Medications */}
            <div className="screening-item">
              <label className="screening-label">Are you currently taking any prescription medications, over-the-counter medications, or supplements? <span className="req">*</span></label>
              <div className="radio-row">
                <label><input type="radio" name="medications" value="Yes" required className="screening-radio" /> Yes</label>
                <label><input type="radio" name="medications" value="No" className="screening-radio" /> No</label>
              </div>
              <div id="medications-details" className="details-field" style={{display:'none'}}>
                <label htmlFor="medicationDetails">Please list all medications and supplements:</label>
                <textarea id="medicationDetails" rows="2"></textarea>
              </div>
            </div>

            {/* Heart */}
            <div className="screening-item">
              <label className="screening-label">Have you been diagnosed with any heart or cardiovascular condition? <span className="req">*</span></label>
              <div className="radio-row">
                <label><input type="radio" name="heartCondition" value="Yes" required className="screening-radio" /> Yes</label>
                <label><input type="radio" name="heartCondition" value="No" className="screening-radio" /> No</label>
              </div>
              <div id="heartCondition-details" className="details-field" style={{display:'none'}}>
                <label htmlFor="heartDetails">Please describe:</label>
                <textarea id="heartDetails" rows="2"></textarea>
              </div>
            </div>

            {/* Kidney/Liver */}
            <div className="screening-item">
              <label className="screening-label">Have you been diagnosed with kidney disease or liver disease? <span className="req">*</span></label>
              <div className="radio-row">
                <label><input type="radio" name="kidneyLiver" value="Yes" required className="screening-radio" /> Yes</label>
                <label><input type="radio" name="kidneyLiver" value="No" className="screening-radio" /> No</label>
              </div>
              <div id="kidneyLiver-details" className="details-field" style={{display:'none'}}>
                <label htmlFor="kidneyLiverDetails">Please describe:</label>
                <textarea id="kidneyLiverDetails" rows="2"></textarea>
              </div>
            </div>

            {/* Diabetes */}
            <div className="screening-item">
              <label className="screening-label">Have you been diagnosed with diabetes (Type 1, Type 2, or gestational)? <span className="req">*</span></label>
              <div className="radio-row">
                <label><input type="radio" name="diabetes" value="Yes" required className="screening-radio" /> Yes</label>
                <label><input type="radio" name="diabetes" value="No" className="screening-radio" /> No</label>
              </div>
              <div id="diabetes-details" className="details-field" style={{display:'none'}}>
                <label htmlFor="diabetesDetails">Please describe:</label>
                <textarea id="diabetesDetails" rows="2"></textarea>
              </div>
            </div>

            {/* Bleeding */}
            <div className="screening-item">
              <label className="screening-label">Do you have a known bleeding disorder or are you taking blood thinners (e.g., warfarin, Eliquis, Xarelto)? <span className="req">*</span></label>
              <div className="radio-row">
                <label><input type="radio" name="bleeding" value="Yes" required className="screening-radio" /> Yes</label>
                <label><input type="radio" name="bleeding" value="No" className="screening-radio" /> No</label>
              </div>
              <div id="bleeding-details" className="details-field" style={{display:'none'}}>
                <label htmlFor="bleedingDetails">Please describe:</label>
                <textarea id="bleedingDetails" rows="2"></textarea>
              </div>
            </div>

            {/* Recent Surgery */}
            <div className="screening-item">
              <label className="screening-label">Have you had any surgical procedure within the past 30 days? <span className="req">*</span></label>
              <div className="radio-row">
                <label><input type="radio" name="recentSurgery" value="Yes" required className="screening-radio" /> Yes</label>
                <label><input type="radio" name="recentSurgery" value="No" className="screening-radio" /> No</label>
              </div>
              <div id="recentSurgery-details" className="details-field" style={{display:'none'}}>
                <label htmlFor="surgeryDetails">Please describe:</label>
                <textarea id="surgeryDetails" rows="2"></textarea>
              </div>
            </div>
          </div>

          {/* ===== RISKS & COMPLICATIONS ===== */}
          <div className="section">
            <h2 className="section-title">Risks & Potential Complications</h2>
            <div className="info-block">
              <p>IV and injection therapy, while generally well-tolerated, carries inherent medical risks. The following potential risks and complications have been disclosed to you:</p>
              <ul className="risk-list">
                <li>Pain, bruising, swelling, redness, or tenderness at the injection or IV insertion site</li>
                <li>Infiltration or extravasation (leakage of fluid into surrounding tissue)</li>
                <li>Phlebitis (inflammation of the vein), thrombophlebitis, or localized infection</li>
                <li>Hematoma formation at the venipuncture site</li>
                <li>Allergic or hypersensitivity reactions to administered substances, including anaphylaxis in rare cases</li>
                <li>Vasovagal response (lightheadedness, dizziness, nausea, or fainting)</li>
                <li>Air embolism (extremely rare with standard protocols)</li>
                <li>Nerve irritation or injury near the injection site</li>
                <li>Fluid overload, electrolyte imbalance, or alterations in blood chemistry</li>
                <li>Hemolytic crisis in patients with undiagnosed G6PD deficiency receiving high-dose Vitamin C</li>
                <li>Adverse drug interactions with current medications or supplements</li>
                <li>Cardiac arrhythmia associated with rapid electrolyte infusion (rare)</li>
                <li>Systemic infection or sepsis if sterile technique is compromised (extremely rare)</li>
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
                <span className="ack-text">I understand that IV and injection therapies provided by Range Medical are elective wellness services. These services are not intended to diagnose, treat, cure, or prevent any disease, medical condition, or pathology. I acknowledge that these therapies do not replace evaluation, diagnosis, or treatment by my primary care physician or any specialist.</span>
              </label>
            </div>

            <div className="ack-item">
              <label>
                <input type="checkbox" id="ack2" className="ack-checkbox" required />
                <span className="ack-initials"></span>
                <span className="ack-text">I understand that individual results from IV and injection therapy vary and are not guaranteed. Range Medical makes no representations, warranties, or guarantees regarding the specific outcomes, efficacy, or therapeutic benefit of any treatment administered.</span>
              </label>
            </div>

            <div className="ack-item">
              <label>
                <input type="checkbox" id="ack3" className="ack-checkbox" required />
                <span className="ack-initials"></span>
                <span className="ack-text">I have been informed of the risks and potential complications associated with IV and injection therapy, as detailed in the Risks & Potential Complications section above. I accept these risks voluntarily and understand that complications may occur even when all procedures are performed correctly and with appropriate medical oversight.</span>
              </label>
            </div>

            <div className="ack-item">
              <label>
                <input type="checkbox" id="ack4" className="ack-checkbox" required />
                <span className="ack-initials"></span>
                <span className="ack-text">I confirm that I have disclosed all relevant medical history, current medications (including over-the-counter drugs and supplements), known allergies, and pre-existing health conditions to Range Medical staff. I understand that failure to disclose accurate and complete medical information may compromise the safety of my treatment and that Range Medical shall not be held liable for complications arising from undisclosed medical information.</span>
              </label>
            </div>

            <div className="ack-item">
              <label>
                <input type="checkbox" id="ack5" className="ack-checkbox" required />
                <span className="ack-initials"></span>
                <span className="ack-text">I understand that some substances administered via IV or injection may be used in an off-label capacity. Off-label use refers to the medically accepted practice of using FDA-approved substances for purposes, dosages, or routes of administration not specifically included in the FDA-approved labeling. I consent to such off-label use when recommended by Range Medical's clinical staff.</span>
              </label>
            </div>

            <div className="ack-item">
              <label>
                <input type="checkbox" id="ack6" className="ack-checkbox" required />
                <span className="ack-initials"></span>
                <span className="ack-text">I acknowledge that IV and injection therapy is not a substitute for routine medical care. I understand that I should continue to see my primary care physician and any specialists for the management of existing health conditions, preventive care, and medical concerns unrelated to the wellness services provided by Range Medical.</span>
              </label>
            </div>

            <div className="ack-item">
              <label>
                <input type="checkbox" id="ack7" className="ack-checkbox" required />
                <span className="ack-initials"></span>
                <span className="ack-text">I agree to immediately notify Range Medical staff during or after treatment if I experience any adverse reaction, unusual symptoms, discomfort, or change in my condition, including but not limited to difficulty breathing, chest pain, severe headache, swelling, rash, or any symptom that concerns me.</span>
              </label>
            </div>

            <div className="ack-item">
              <label>
                <input type="checkbox" id="ack8" className="ack-checkbox" required />
                <span className="ack-initials"></span>
                <span className="ack-text">I understand that I have the right to refuse or discontinue treatment at any time without penalty. I acknowledge that refusing or discontinuing treatment may affect the anticipated outcome of the therapy.</span>
              </label>
            </div>

            <div className="ack-item">
              <label>
                <input type="checkbox" id="ack9" className="ack-checkbox" required />
                <span className="ack-initials"></span>
                <span className="ack-text">I voluntarily assume full responsibility for any risks associated with the IV and/or injection therapy services I receive at Range Medical. I release, discharge, and hold harmless Range Medical, its medical director, physicians, nurse practitioners, registered nurses, medical assistants, staff, and affiliated entities from any and all claims, liabilities, damages, or causes of action arising out of or related to the services provided, except in cases of gross negligence or willful misconduct.</span>
              </label>
            </div>

            <div className="ack-item">
              <label>
                <input type="checkbox" id="ack10" className="ack-checkbox" required />
                <span className="ack-initials"></span>
                <span className="ack-text">I acknowledge that I am financially responsible for all services rendered. I understand that IV and injection therapy services are generally not covered by health insurance, and that payment is due at the time of service. Refunds are not provided for completed treatments.</span>
              </label>
            </div>

            <div className="ack-item">
              <label>
                <input type="checkbox" id="ack11" className="ack-checkbox" required />
                <span className="ack-initials"></span>
                <span className="ack-text">I authorize Range Medical to contact me via phone, text message, and/or email at the contact information provided above for purposes related to my care, including appointment reminders, follow-up communications, and health-related information.</span>
              </label>
            </div>

            <div className="ack-item">
              <label>
                <input type="checkbox" id="ack12" className="ack-checkbox" required />
                <span className="ack-initials"></span>
                <span className="ack-text">I confirm that I am at least 18 years of age (or that the consent of a parent/legal guardian has been obtained), that I have read this consent form in its entirety, that I have had the opportunity to ask questions, and that I am signing this form voluntarily and of my own free will.</span>
              </label>
            </div>
          </div>

          {/* ===== SIGNATURE ===== */}
          <div className="section">
            <h2 className="section-title">Patient Signature</h2>
            <p className="section-desc">By signing below, I certify that I have read, understood, and agree to all statements contained in this Informed Consent for IV & Injection Therapy.</p>
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
        .form-group input, .form-group textarea, .form-group select { width: 100%; padding: 10px 12px; border: 1px solid #ccc; border-radius: 4px; font-size: 14px; background: #fff; }
        .form-group input:focus, .form-group textarea:focus { border-color: #000; outline: none; box-shadow: 0 0 0 2px rgba(0,0,0,0.1); }
        .req { color: #dc2626; }
        .info-block { background: #fafafa; border: 1px solid #e5e5e5; border-radius: 6px; padding: 20px; }
        .info-block p { font-size: 14px; line-height: 1.6; color: #333; margin-bottom: 12px; }
        .info-block p:last-child { margin-bottom: 0; }
        .risk-list { padding-left: 20px; margin-top: 8px; }
        .risk-list li { font-size: 13px; line-height: 1.5; color: #444; margin-bottom: 6px; }
        .screening-item { background: #fafafa; border: 1px solid #e5e5e5; border-radius: 6px; padding: 16px; margin-bottom: 12px; }
        .screening-item.critical { background: #fef2f2; border-color: #fecaca; }
        .screening-label { font-size: 14px; font-weight: 600; display: block; margin-bottom: 6px; }
        .screening-note { font-size: 12px; color: #b91c1c; font-style: italic; margin-bottom: 8px; }
        .radio-row { display: flex; gap: 20px; margin-top: 4px; }
        .radio-row label { font-size: 14px; cursor: pointer; display: flex; align-items: center; gap: 6px; }
        .details-field { margin-top: 10px; }
        .details-field label { font-size: 13px; font-weight: 500; display: block; margin-bottom: 4px; }
        .details-field textarea { width: 100%; padding: 8px 10px; border: 1px solid #ccc; border-radius: 4px; font-size: 13px; resize: vertical; }
        .ack-item { border: 1px solid #e5e7eb; border-radius: 6px; padding: 14px 16px; margin-bottom: 10px; transition: border-color 0.2s; }
        .ack-item:hover { border-color: #999; }
        .ack-item label { display: flex; gap: 12px; cursor: pointer; align-items: flex-start; }
        .ack-checkbox { position: absolute; opacity: 0; width: 0; height: 0; }
        .ack-initials { width: 28px; height: 28px; min-width: 28px; border: 2px solid #d4d4d4; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; color: transparent; background: #fff; cursor: pointer; transition: all 0.15s; margin-top: 1px; user-select: none; }
        .ack-checkbox:checked + .ack-initials { background: #000; border-color: #000; color: #fff; }
        .ack-text { font-size: 13px; line-height: 1.55; color: #333; }
        .signature-container { border: 2px solid #000; border-radius: 6px; margin-bottom: 8px; overflow: hidden; background: #fff; }
        .signature-pad { width: 100%; height: 150px; cursor: crosshair; }
        .signature-actions { text-align: right; }
        .btn-clear { background: none; border: 1px solid #ccc; padding: 6px 14px; border-radius: 4px; cursor: pointer; font-size: 13px; }
        .btn-clear:hover { background: #f5f5f5; }
        .field-error { color: #dc2626; font-size: 12px; display: block; margin-top: 4px; }
        .submit-section { padding-top: 20px; text-align: center; }
        .btn-submit { background: #000; color: #fff; border: none; padding: 14px 48px; font-size: 16px; font-weight: 600; border-radius: 6px; cursor: pointer; letter-spacing: 0.5px; }
        .btn-submit:hover { background: #222; }
        .btn-submit:disabled { background: #999; cursor: not-allowed; }
        .validation-summary{background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:1rem 1.5rem;margin-bottom:1rem;display:none}
        .validation-summary.visible{display:block}
        .validation-summary h3{color:#991b1b;font-size:.9375rem;margin-bottom:.5rem}
        .validation-summary ul{margin:0;padding-left:1.25rem;color:#dc2626;font-size:.875rem}
        .validation-summary ul li{margin-bottom:.25rem}
        .status-message { margin-top: 16px; padding: 12px; border-radius: 6px; font-size: 14px; text-align: center; }
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
