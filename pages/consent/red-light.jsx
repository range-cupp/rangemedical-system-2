import Head from 'next/head';
import Script from 'next/script';
import { useState, useEffect, useRef } from 'react';

const CONFIG = {
  supabase: {
    url: 'https://teivfptpozltpqwahgdl.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlaXZmcHRwb3psdHBxd2FoZ2RsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3MTMxNDksImV4cCI6MjA4MDI4OTE0OX0.NrI1AykMBOh91mM9BFvpSH0JwzGrkv5ADDkZinh0elc'
  },
  ghl: {
    customFieldKey: 'red_light_therapy_consent',
    tags: ['red-light-consent-signed', 'consent-completed']
  },
  consentType: 'red-light',
  recipientEmail: 'cupp@range-medical.com'
};

const HEALTH_QUESTIONS = [
  { id: 'q1', text: 'Have you had Botox or face injections in the last 2 weeks?', note: '(This includes dermal fillers, microneedling, or microblading)', label: 'Recent Botox/face injections' },
  { id: 'q2', text: 'Are you pregnant?', note: '', hasNA: true, label: 'Pregnancy' },
  { id: 'q3', text: 'Are you taking medicine that makes you sensitive to light?', note: '(Like lithium, melatonin, certain antibiotics, or water pills)', label: 'Light-sensitive medications' },
  { id: 'q4', text: 'Do you have skin cancer or strange spots on your skin?', note: '', label: 'Skin cancer or lesions' },
  { id: 'q5', text: 'Do you have thyroid problems that are not controlled?', note: '', label: 'Uncontrolled thyroid' },
  { id: 'q6', text: 'Do you have lupus or other conditions that make you sensitive to light?', note: '(Like porphyria)', label: 'Lupus/light sensitivity' },
  { id: 'q7', text: 'Do your eyes or skin get hurt easily by bright light?', note: '', label: 'Eyes/skin sensitive to light' }
];

export default function RedLightConsentForm() {
  const [scriptsLoaded, setScriptsLoaded] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '', dateOfBirth: '', consentDate: '',
    q1: '', q2: '', q3: '', q4: '', q5: '', q6: '', q7: '',
    consentGiven: false
  });
  const [errors, setErrors] = useState({});
  const [validationMessages, setValidationMessages] = useState([]);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  
  const [ghlContactId, setGhlContactId] = useState('');
  const signaturePadRef = useRef(null);
  const signatureCanvasRef = useRef(null);
  const supabaseRef = useRef(null);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setFormData(prev => ({ ...prev, consentDate: today }));
    const urlParams = new URLSearchParams(window.location.search);
    setGhlContactId(urlParams.get('contactId') || urlParams.get('contact_id') || urlParams.get('cid') || '');
  }, []);

  useEffect(() => {
    const hasYes = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7'].some(q => formData[q] === 'yes');
    setShowWarning(hasYes);
  }, [formData.q1, formData.q2, formData.q3, formData.q4, formData.q5, formData.q6, formData.q7]);

  const initializeForm = () => {
    if (typeof window !== 'undefined' && window.supabase && window.SignaturePad) {
      supabaseRef.current = window.supabase.createClient(CONFIG.supabase.url, CONFIG.supabase.anonKey);
      
      const canvas = signatureCanvasRef.current;
      if (canvas) {
        const container = canvas.parentElement;
        canvas.width = container.offsetWidth;
        canvas.height = 200;
        
        signaturePadRef.current = new window.SignaturePad(canvas, {
          backgroundColor: 'rgb(255, 255, 255)',
          penColor: 'rgb(0, 0, 0)'
        });
      }
      setScriptsLoaded(true);
    }
  };

  const handleScriptLoad = () => {
    if (typeof window !== 'undefined' && window.supabase && window.SignaturePad && window.jspdf) {
      initializeForm();
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: false }));
    }
  };

  const handleDobChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length >= 2) value = value.slice(0, 2) + '/' + value.slice(2);
    if (value.length >= 5) value = value.slice(0, 5) + '/' + value.slice(5);
    if (value.length > 10) value = value.slice(0, 10);
    setFormData(prev => ({ ...prev, dateOfBirth: value }));
    if (errors.dateOfBirth) setErrors(prev => ({ ...prev, dateOfBirth: false }));
  };

  const clearSignature = () => {
    if (signaturePadRef.current) {
      signaturePadRef.current.clear();
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const missing = [];
    const fieldLabels = { firstName: 'First Name', lastName: 'Last Name', email: 'Email', phone: 'Phone', dateOfBirth: 'Date of Birth', consentDate: 'Consent Date' };
    const required = ['firstName', 'lastName', 'email', 'phone', 'dateOfBirth', 'consentDate'];

    required.forEach(field => {
      if (!formData[field]?.trim()) { newErrors[field] = true; missing.push(fieldLabels[field]); }
    });

    const unanswered = [];
    HEALTH_QUESTIONS.forEach(q => {
      if (!formData[q.id]) { newErrors[q.id] = true; unanswered.push(q.label); }
    });
    if (unanswered.length > 0) missing.push('Health Questions: ' + unanswered.join(', '));

    if (!formData.consentGiven) { newErrors.consentGiven = true; missing.push('Consent Checkbox'); }
    if (signaturePadRef.current?.isEmpty()) { newErrors.signature = true; missing.push('Signature'); }

    setErrors(newErrors);
    setValidationMessages(missing);
    return Object.keys(newErrors).length === 0;
  };

  const uploadSignature = async (patientName) => {
    const dataUrl = signaturePadRef.current.toDataURL('image/png');
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    
    const timestamp = Date.now();
    const safeName = patientName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const fileName = `signatures/red-light-consent/${safeName}-${timestamp}.png`;

    const { error } = await supabaseRef.current.storage
      .from('medical-documents')
      .upload(fileName, blob, { contentType: 'image/png' });

    if (error) throw new Error('Signature upload failed');

    const { data: urlData } = supabaseRef.current.storage
      .from('medical-documents')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  };

  const uploadPDF = async (pdfBlob, patientName) => {
    const timestamp = Date.now();
    const safeName = patientName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const fileName = `consents/red-light-consent/${safeName}-${timestamp}.pdf`;

    const { error } = await supabaseRef.current.storage
      .from('medical-documents')
      .upload(fileName, pdfBlob, { contentType: 'application/pdf' });

    if (error) throw new Error('PDF upload failed');

    const { data: urlData } = supabaseRef.current.storage
      .from('medical-documents')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  };

  const generatePDF = () => {
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

    function addBullet(text) {
      checkPageBreak(8);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize('• ' + text, contentWidth - 5);
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
    doc.text('Red Light Therapy — Informed Consent', leftMargin, 16);
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

    // ========== TREATMENT DESCRIPTION ==========
    addSectionHeader('What This Treatment Does');
    addText('Red Light Therapy uses special red light that goes into your skin. The light helps your cells work better and heal faster. It can help reduce pain, make your skin look better, and give you more energy.', 8.5);
    yPos += 2;
    addText('How It Works:', 9, true);
    addText('The red light goes through your skin to reach your cells. Your cells use the light to make more energy. More energy helps your body heal and feel better.', 8.5);
    yPos += 2;
    addText('What It Might Help With:', 9, true);
    addBullet('Have more energy and feel less tired');
    addBullet('Heal faster from injuries');
    addBullet('Have less pain in your joints');
    addBullet('Make your skin look younger and healthier');
    addBullet('Help your muscles feel better after exercise');
    yPos += 1;
    addText('Important: Everyone is different. The treatment might work better for some people than others.', 8.5, true);
    yPos += 2;

    // ========== HEALTH SCREENING ==========
    addSectionHeader('Health Screening Responses');

    const yesAnswers = HEALTH_QUESTIONS.filter(q => formData[q.id] === 'yes').map(q => q.label);

    if (yesAnswers.length > 0) {
      checkPageBreak(12 + yesAnswers.length * 5);
      doc.setFillColor(254, 243, 199);
      const boxHeight = 10 + (yesAnswers.length * 5);
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
      yesAnswers.forEach(q => {
        doc.text('• ' + q, leftMargin + 6, yPos);
        yPos += 4.5;
      });
      doc.setTextColor(0, 0, 0);
      doc.setDrawColor(0);
      yPos += 4;
    }

    HEALTH_QUESTIONS.forEach((q, i) => {
      addLabelValue((i + 1) + '. ' + q.label + ': ', (formData[q.id] || 'not answered').toUpperCase());
    });
    yPos += 2;

    // ========== RISKS ==========
    addSectionHeader('Things That Might Happen');
    addText('This treatment is very safe. Most people feel fine. But a few things might happen:', 8.5);
    addBullet('Your skin might feel warm or look a little red');
    addBullet('You might feel tired after treatment');
    addBullet('Your eyes might be sensitive to light for a bit');
    addBullet('Rarely: You might get a mild headache');
    yPos += 1;
    addText('Tell our staff right away if something doesn\'t feel right.', 8.5);
    yPos += 2;

    // ========== PATIENT RESPONSIBILITIES ==========
    addSectionHeader('What You Need To Do');
    addBullet('Wear the special eye protection we give you');
    addBullet('Don\'t put lotion, oil, or makeup on the area before treatment');
    addBullet('Tell us about any new medicines you take');
    addBullet('Tell us if you notice any strange skin changes');
    addBullet('Follow all safety rules');
    yPos += 1;
    addText('How Long Treatment Takes: Each treatment takes about 10 to 20 minutes. Your doctor will tell you how many treatments you need. You can do normal things right after treatment.', 8.5);
    yPos += 4;

    // ========== CONSENT ACKNOWLEDGMENT ==========
    addSectionHeader('Consent Acknowledgment');
    addText('I understand and agree: I have read this form (or someone read it to me). I understand what Red Light Therapy is and what might happen. I know it might not work for me. I can ask questions if I want. I agree to get Red Light Therapy at Range Medical. I will not blame Range Medical if something goes wrong, unless they did something very bad on purpose.', 8.5, true);
    yPos += 4;

    // ========== PATIENT SIGNATURE ==========
    addSectionHeader('Patient Signature');
    addText('By affixing my signature below, I certify that I have read this consent form in its entirety, that all of my questions have been answered to my satisfaction, and that I voluntarily consent to Red Light Therapy at Range Medical.', 8.5);
    yPos += 3;
    addLabelValue('Signed by: ', formData.firstName + ' ' + formData.lastName);
    addLabelValue('Date: ', formData.consentDate);
    yPos += 2;

    if (signaturePadRef.current && !signaturePadRef.current.isEmpty()) {
      checkPageBreak(35);
      try {
        const sigData = signaturePadRef.current.toDataURL('image/png');
        doc.addImage(sigData, 'PNG', leftMargin, yPos, 60, 25);
        yPos += 28;
      } catch (e) {
        console.error('Error adding signature:', e);
      }
    }

    // ========== FOOTER ON ALL PAGES ==========
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(130);
      doc.text('Page ' + i + ' of ' + totalPages, pageWidth - 15, pageHeight - 4, { align: 'right' });
      doc.text('Range Medical | 1901 Westcliff Dr, Suite 10, Newport Beach, CA 92660 | (949) 997-3988', pageWidth / 2, pageHeight - 8, { align: 'center' });
      doc.text('CONFIDENTIAL — Red Light Therapy Consent', pageWidth / 2, pageHeight - 4, { align: 'center' });
    }

    return doc.output('blob');
  };

  const saveToDatabase = async (signatureUrl, pdfUrl) => {
    const payload = {
      consentType: CONFIG.consentType,
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      dateOfBirth: formData.dateOfBirth,
      consentDate: formData.consentDate,
      signatureUrl,
      pdfUrl,
      consentGiven: formData.consentGiven,
      ghlContactId,
      healthAnswers: {
        q1: formData.q1, q2: formData.q2, q3: formData.q3, q4: formData.q4,
        q5: formData.q5, q6: formData.q6, q7: formData.q7
      }
    };

    await fetch('/api/consent-forms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  };

  const sendToGHL = async (signatureUrl, pdfUrl) => {
    const yesAnswers = HEALTH_QUESTIONS.filter(q => formData[q.id] === 'yes').map(q => q.label);

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
      signatureUrl,
      pdfUrl,
      healthScreening: { yesAnswers }
    };

    await fetch('/api/consent-to-ghl', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setTimeout(() => {
        const summaryEl = document.getElementById('validationSummary');
        if (summaryEl) summaryEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
      return;
    }

    setIsSubmitting(true);
    setStatus({ type: 'loading', message: 'Submitting your form...' });

    try {
      const patientName = `${formData.firstName} ${formData.lastName}`;

      setStatus({ type: 'loading', message: 'Uploading signature...' });
      const signatureUrl = await uploadSignature(patientName);

      setStatus({ type: 'loading', message: 'Creating PDF...' });
      const pdfBlob = generatePDF();

      setStatus({ type: 'loading', message: 'Uploading PDF...' });
      const pdfUrl = await uploadPDF(pdfBlob, patientName);

      setStatus({ type: 'loading', message: 'Saving to database...' });
      await saveToDatabase(signatureUrl, pdfUrl);

      setStatus({ type: 'loading', message: 'Updating patient record...' });
      await sendToGHL(signatureUrl, pdfUrl);

      setShowThankYou(true);
    } catch (error) {
      console.error('Submission error:', error);
      setStatus({ type: 'error', message: 'Error: ' + error.message });
      setIsSubmitting(false);
    }
  };

  if (showThankYou) {
    return (
      <>
        <Head>
          <title>Thank You | Range Medical</title>
        </Head>
        <style jsx global>{styles}</style>
        <div className="container">
          <div className="thank-you-page">
            <div className="thank-you-icon">✓</div>
            <h1>Thank You, {formData.firstName}!</h1>
            <p className="thank-you-subtitle">Your form has been sent.</p>
            <div className="thank-you-details">
              <p>We got your Red Light Therapy consent form.</p>
              <p>Our team will look at it before your treatment.</p>
            </div>
            <div className="thank-you-contact">
              <h3>Have Questions?</h3>
              <p>Email us at <a href="mailto:info@range-medical.com">info@range-medical.com</a></p>
            </div>
            <div className="thank-you-footer">
              <p>RANGE MEDICAL</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Red Light Therapy Consent | Range Medical</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <Script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js" onLoad={handleScriptLoad} />

      <Script src="https://cdn.jsdelivr.net/npm/signature_pad@4.1.7/dist/signature_pad.umd.min.js" onLoad={handleScriptLoad} />
      <Script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2" onLoad={handleScriptLoad} />

      <style jsx global>{styles}</style>

      <div className="container">
        <div className="header">
          <h1 className="clinic-name">RANGE MEDICAL</h1>
          <p className="form-title">Red Light Therapy — Informed Consent</p>
        </div>

        <div className="form-container">
          {status.message && (
            <div className={`status-message visible ${status.type}`}>{status.message}</div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Patient Information */}
            <div className="section">
              <h3 className="section-title">Your Information</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label>First Name <span className="required">*</span></label>
                  <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} className={errors.firstName ? 'error' : ''} />
                </div>
                <div className="form-group">
                  <label>Last Name <span className="required">*</span></label>
                  <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} className={errors.lastName ? 'error' : ''} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Email <span className="required">*</span></label>
                  <input type="email" name="email" value={formData.email} onChange={handleInputChange} className={errors.email ? 'error' : ''} />
                </div>
                <div className="form-group">
                  <label>Phone <span className="required">*</span></label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className={errors.phone ? 'error' : ''} />
                  <p style={{ fontSize: '0.6rem', color: '#a3a3a3', lineHeight: 1.4, marginTop: '0.25rem' }}>By providing my phone number, I agree to receive texts from Range Medical. Msg &amp; data rates may apply. Up to 10 msg/mo. Reply STOP to opt out. <a href="/terms-of-use" target="_blank" rel="noopener noreferrer" style={{ color: '#a3a3a3', textDecoration: 'underline' }}>Terms</a> &amp; <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" style={{ color: '#a3a3a3', textDecoration: 'underline' }}>Privacy</a>.</p>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Date of Birth <span className="required">*</span></label>
                  <input type="text" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleDobChange} placeholder="MM/DD/YYYY" maxLength="10" className={errors.dateOfBirth ? 'error' : ''} />
                </div>
                <div className="form-group">
                  <label>Today's Date <span className="required">*</span></label>
                  <input type="date" name="consentDate" value={formData.consentDate} onChange={handleInputChange} className={errors.consentDate ? 'error' : ''} />
                </div>
              </div>
            </div>

            {/* Health Questions */}
            <div className="section">
              <h3 className="section-title">Health Questions</h3>
              <p style={{ marginBottom: '1.5rem', color: '#404040' }}>Please answer these questions. They help us keep you safe.</p>

              {showWarning && (
                <div className="warning-alert visible">
                  <h4>⚠️ Important</h4>
                  <p>Based on your answers, please talk to our staff before your treatment. We want to make sure this treatment is safe for you.</p>
                </div>
              )}

              {HEALTH_QUESTIONS.map(q => (
                <div key={q.id} className={`health-question ${formData[q.id] === 'yes' ? 'warning' : ''}`}>
                  <div className="health-question-text">{q.text}</div>
                  {q.note && <div className="health-question-note">{q.note}</div>}
                  <div className="radio-group">
                    <div className="radio-item">
                      <input type="radio" id={`${q.id}-yes`} name={q.id} value="yes" checked={formData[q.id] === 'yes'} onChange={handleInputChange} />
                      <label htmlFor={`${q.id}-yes`}>Yes</label>
                    </div>
                    <div className="radio-item">
                      <input type="radio" id={`${q.id}-no`} name={q.id} value="no" checked={formData[q.id] === 'no'} onChange={handleInputChange} />
                      <label htmlFor={`${q.id}-no`}>No</label>
                    </div>
                    {q.hasNA && (
                      <div className="radio-item">
                        <input type="radio" id={`${q.id}-na`} name={q.id} value="n/a" checked={formData[q.id] === 'n/a'} onChange={handleInputChange} />
                        <label htmlFor={`${q.id}-na`}>Does not apply</label>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Consent Information */}
            <div className="section">
              <h3 className="section-title">Treatment Information</h3>

              <div className="consent-text">
                <h4>What This Treatment Does</h4>
                <p>Red Light Therapy uses special red light that goes into your skin. The light helps your cells work better and heal faster. It can help reduce pain, make your skin look better, and give you more energy.</p>

                <h4>How It Works</h4>
                <p>The red light goes through your skin to reach your cells. Your cells use the light to make more energy. More energy helps your body heal and feel better.</p>

                <h4>What It Might Help With</h4>
                <p>This treatment might help you:</p>
                <ul>
                  <li>Have more energy and feel less tired</li>
                  <li>Heal faster from injuries</li>
                  <li>Have less pain in your joints</li>
                  <li>Make your skin look younger and healthier</li>
                  <li>Help your muscles feel better after exercise</li>
                </ul>
                <p><strong>Important:</strong> Everyone is different. The treatment might work better for some people than others.</p>

                <h4>Things That Might Happen</h4>
                <p>This treatment is very safe. Most people feel fine. But a few things might happen:</p>
                <ul>
                  <li>Your skin might feel warm or look a little red</li>
                  <li>You might feel tired after treatment</li>
                  <li>Your eyes might be sensitive to light for a bit</li>
                  <li>Rarely: You might get a mild headache</li>
                </ul>
                <p>Tell our staff right away if something doesn't feel right.</p>

                <h4>What You Need To Do</h4>
                <ul>
                  <li>Wear the special eye protection we give you</li>
                  <li>Don't put lotion, oil, or makeup on the area before treatment</li>
                  <li>Tell us about any new medicines you take</li>
                  <li>Tell us if you notice any strange skin changes</li>
                  <li>Follow all safety rules</li>
                </ul>

                <h4>How Long Treatment Takes</h4>
                <p>Each treatment takes about 10 to 20 minutes. Your doctor will tell you how many treatments you need. You can do normal things right after treatment.</p>
              </div>

              <div className={`checkbox-consent ${errors.consentGiven ? 'error' : ''}`}>
                <input type="checkbox" id="consentGiven" name="consentGiven" checked={formData.consentGiven} onChange={handleInputChange} />
                <label htmlFor="consentGiven">
                  <strong>I understand and agree:</strong> I have read this form (or someone read it to me). I understand what Red Light Therapy is and what might happen. I know it might not work for me. I can ask questions if I want. I agree to get Red Light Therapy at Range Medical. I will not blame Range Medical if something goes wrong, unless they did something very bad on purpose.
                </label>
              </div>
            </div>

            {/* Signature */}
            <div className="section">
              <h3 className="section-title">Your Signature</h3>

              <div className="signature-wrapper">
                <span className="signature-label">Sign Below <span className="required">*</span></span>
                <div className={`signature-pad-container ${errors.signature ? 'error' : ''}`}>
                  <canvas ref={signatureCanvasRef} style={{ width: '100%', height: '200px' }} />
                </div>
                <div className="signature-controls">
                  <button type="button" className="btn-clear" onClick={clearSignature}>Clear Signature</button>
                </div>
              </div>

              <p style={{ fontSize: '0.875rem', color: '#525252', marginTop: '1rem' }}>
                By signing, I agree that I read and understand this form. I agree to get Red Light Therapy at Range Medical.
              </p>
            </div>

            {/* Submit */}
            <div className="submit-section">
              {validationMessages.length > 0 && (
                <div className="validation-summary" id="validationSummary">
                  <h3>Please complete the following required fields:</h3>
                  <ul>
                    {validationMessages.map((msg, i) => <li key={i}>{msg}</li>)}
                  </ul>
                </div>
              )}
              <button type="submit" className="btn-submit" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit Form'}
              </button>
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

const styles = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; background: #f9f9f9; color: #111; }
  .container { max-width: 720px; margin: 0 auto; background: #fff; min-height: 100vh; }
  .header { background: #000; color: #fff; padding: 24px 28px; }
  .clinic-name { font-size: 22px; font-weight: 700; letter-spacing: 2px; margin-bottom: 4px; color: #fff; }
  .form-title { font-size: 14px; font-weight: 400; opacity: 0.85; color: #fff; text-transform: none; letter-spacing: normal; margin-top: 0; }
  .header p { font-size: 13px; opacity: 0.7; color: #fff; margin-top: 4px; }
  .form-container { background: #fff; border: none; padding: 0 28px 40px; }
  .section { border-bottom: 1px solid #e5e5e5; padding: 28px 0; margin-bottom: 0; }
  .section:last-of-type { border-bottom: none; padding-bottom: 0; }
  .section-title { font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid #000; display: block; }
  .form-row { display: flex; gap: 16px; margin-bottom: 16px; }
  .form-row:last-child { margin-bottom: 0; }
  .form-group { flex: 1; display: flex; flex-direction: column; }
  label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 4px; color: #333; text-transform: none; letter-spacing: normal; }
  .required { color: #dc2626; margin-left: 2px; }
  input[type="text"], input[type="email"], input[type="tel"], input[type="date"], select, textarea { width: 100%; padding: 10px 12px; font-size: 14px; font-family: inherit; border: 1px solid #ccc; background: #fff; color: #111; border-radius: 4px; transition: border-color 0.2s ease; }
  input:focus, select:focus, textarea:focus { outline: none; border-color: #000; box-shadow: 0 0 0 2px rgba(0,0,0,0.1); }
  input.error, select.error, textarea.error { border-color: #dc2626; }
  .health-question { background: #fafafa; border: 1px solid #e5e5e5; border-radius: 6px; padding: 16px; margin-bottom: 12px; }
  .health-question.warning { background: #fff7ed; border-color: #f59e0b; }
  .health-question-text { font-size: 14px; font-weight: 600; margin-bottom: 6px; color: #111; line-height: 1.5; }
  .health-question-note { font-size: 12px; color: #666; font-style: italic; margin-bottom: 8px; }
  .radio-group { display: flex; gap: 20px; flex-wrap: wrap; }
  .radio-item { display: flex; align-items: center; gap: 6px; cursor: pointer; }
  .radio-item input[type="radio"] { width: 1.25rem; height: 1.25rem; cursor: pointer; accent-color: #000; }
  .radio-item label { font-size: 14px; font-weight: 500; text-transform: none; letter-spacing: normal; margin-bottom: 0; cursor: pointer; color: #333; }
  .warning-alert { background: #fef3c7; border: 2px solid #f59e0b; border-radius: 6px; padding: 16px; margin-bottom: 16px; display: none; }
  .warning-alert.visible { display: block; }
  .warning-alert h4 { font-size: 14px; font-weight: 700; color: #92400e; margin-bottom: 4px; }
  .warning-alert p { font-size: 13px; color: #78350f; line-height: 1.5; }
  .consent-text { background: #fafafa; border: 1px solid #e5e5e5; border-radius: 6px; padding: 20px; margin-bottom: 16px; line-height: 1.6; }
  .consent-text h4 { font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px; margin-top: 16px; color: #262626; }
  .consent-text h4:first-child { margin-top: 0; }
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
  .signature-pad-container { border: 2px solid #000; border-radius: 6px; background: #fff; margin-bottom: 8px; overflow: hidden; }
  .signature-pad-container.error { border-color: #dc2626; }
  .signature-controls { text-align: right; }
  .btn-clear { background: none; border: 1px solid #ccc; padding: 6px 14px; border-radius: 4px; cursor: pointer; font-size: 13px; font-family: inherit; }
  .btn-clear:hover { background: #f5f5f5; }
  .submit-section { padding-top: 20px; text-align: center; }
  .btn-submit { background: #000; color: #fff; border: none; padding: 14px 48px; font-size: 16px; font-weight: 600; border-radius: 6px; cursor: pointer; letter-spacing: 0.5px; font-family: inherit; min-width: 250px; }
  .btn-submit:hover:not(:disabled) { background: #222; }
  .btn-submit:disabled { background: #999; cursor: not-allowed; }
  .validation-summary { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 1rem 1.5rem; margin-bottom: 1rem; }
  .validation-summary h3 { color: #991b1b; font-size: 0.9375rem; margin-bottom: 0.5rem; }
  .validation-summary ul { margin: 0; padding-left: 1.25rem; color: #dc2626; font-size: 0.875rem; }
  .validation-summary ul li { margin-bottom: 0.25rem; }
  .status-message { margin-top: 16px; padding: 12px; border-radius: 6px; font-size: 14px; text-align: center; }
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
  @media (max-width: 640px) { .header { padding: 20px 16px; } .form-container { padding: 0 16px 30px; } .form-row { flex-direction: column; gap: 12px; } .radio-group { flex-direction: column; gap: 10px; } }
`;
