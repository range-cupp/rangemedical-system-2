import Head from 'next/head';
import Script from 'next/script';
import { useState, useEffect, useRef } from 'react';

const CONFIG = {
  emailjs: {
    publicKey: 'ZeNFfwJ37Uhd6E1vp',
    serviceId: 'service_pyl6wra',
    templateId: 'template_7yvc578'
  },
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
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  
  const signaturePadRef = useRef(null);
  const signatureCanvasRef = useRef(null);
  const supabaseRef = useRef(null);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setFormData(prev => ({ ...prev, consentDate: today }));
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
    if (typeof window !== 'undefined' && window.supabase && window.SignaturePad && window.jspdf && window.emailjs) {
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
    const required = ['firstName', 'lastName', 'email', 'phone', 'dateOfBirth', 'consentDate'];
    
    required.forEach(field => {
      if (!formData[field]?.trim()) newErrors[field] = true;
    });

    HEALTH_QUESTIONS.forEach(q => {
      if (!formData[q.id]) newErrors[q.id] = true;
    });

    if (!formData.consentGiven) newErrors.consentGiven = true;
    if (signaturePadRef.current?.isEmpty()) newErrors.signature = true;

    setErrors(newErrors);
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
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let yPos = margin;

    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('RANGE MEDICAL', pageWidth / 2, yPos, { align: 'center' });

    yPos += 10;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('Red Light Therapy Consent', pageWidth / 2, yPos, { align: 'center' });

    yPos += 15;
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageWidth - margin, yPos);

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

    yPos += 15;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('HEALTH SCREENING ANSWERS', margin, yPos);

    const yesAnswers = HEALTH_QUESTIONS.filter(q => formData[q.id] === 'yes').map(q => q.label);

    if (yesAnswers.length > 0) {
      yPos += 10;
      doc.setFillColor(255, 243, 205);
      const boxHeight = 10 + (yesAnswers.length * 6);
      doc.rect(margin, yPos - 5, pageWidth - 2 * margin, boxHeight, 'F');
      doc.setTextColor(146, 64, 14);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('ATTENTION: Patient answered YES to:', margin + 5, yPos);
      yPos += 6;
      doc.setFont('helvetica', 'normal');
      yesAnswers.forEach(q => {
        doc.text(`• ${q}`, margin + 10, yPos);
        yPos += 6;
      });
      doc.setTextColor(0, 0, 0);
      yPos += 5;
    }

    yPos += 10;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    HEALTH_QUESTIONS.forEach((q, i) => {
      doc.text(`${i + 1}. ${q.label}: ${formData[q.id]?.toUpperCase() || 'NOT ANSWERED'}`, margin, yPos);
      yPos += 6;
    });

    yPos += 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('PATIENT CONSENT', margin, yPos);

    yPos += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const consent = 'I have read and understand the treatment information. I agree to receive Red Light Therapy at Range Medical.';
    const consentLines = doc.splitTextToSize(consent, pageWidth - 2 * margin);
    doc.text(consentLines, margin, yPos);
    yPos += consentLines.length * 5 + 10;

    doc.setFont('helvetica', 'bold');
    doc.text('Patient Signature:', margin, yPos);

    if (signaturePadRef.current && !signaturePadRef.current.isEmpty()) {
      yPos += 5;
      const sigData = signaturePadRef.current.toDataURL('image/png');
      doc.addImage(sigData, 'PNG', margin, yPos, 60, 22);
      yPos += 27;
    }

    doc.setFont('helvetica', 'normal');
    doc.text(`Signed on: ${formData.consentDate}`, margin, yPos);

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

  const sendEmail = async (pdfBlob) => {
    window.emailjs.init(CONFIG.emailjs.publicKey);

    const base64PDF = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(',')[1]);
      reader.readAsDataURL(pdfBlob);
    });

    const yesAnswers = HEALTH_QUESTIONS.filter(q => formData[q.id] === 'yes').map(q => q.label);
    const warningSection = yesAnswers.length > 0 
      ? `⚠️ WARNING - PATIENT ANSWERED YES TO:\n${yesAnswers.map(a => `  - ${a}`).join('\n')}\n\nPLEASE REVIEW BEFORE TREATMENT\n` 
      : '';

    const healthSummary = HEALTH_QUESTIONS.map(q => `${q.id}: ${formData[q.id]}`).join('\n');

    const messageBody = `
RED LIGHT THERAPY CONSENT FORM SUBMISSION
==========================================
${warningSection}
PATIENT INFORMATION
-------------------
Name: ${formData.firstName} ${formData.lastName}
Email: ${formData.email}
Phone: ${formData.phone}
Date of Birth: ${formData.dateOfBirth}
Date of Consent: ${formData.consentDate}

HEALTH SCREENING ANSWERS
-------------------------
${healthSummary}

CONSENT
-------
Consent Given: ${formData.consentGiven ? 'Yes' : 'No'}
Signature: Provided electronically
Submitted: ${new Date().toLocaleString()}

==========================================
PDF consent form is attached to this email.
`;

    await window.emailjs.send(CONFIG.emailjs.serviceId, CONFIG.emailjs.templateId, {
      to_email: CONFIG.recipientEmail,
      from_name: `${formData.firstName} ${formData.lastName}`,
      patient_name: `${formData.firstName} ${formData.lastName}`,
      patient_email: formData.email,
      patient_phone: formData.phone,
      submission_date: new Date().toLocaleString(),
      message: messageBody,
      content: base64PDF,
      filename: `RangeMedical_RedLightConsent_${formData.lastName}_${formData.firstName}.pdf`
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setStatus({ type: 'error', message: 'Please fill in all required fields.' });
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

      setStatus({ type: 'loading', message: 'Sending email...' });
      await sendEmail(pdfBlob);

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
      <Script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js" onLoad={handleScriptLoad} />
      <Script src="https://cdn.jsdelivr.net/npm/signature_pad@4.1.7/dist/signature_pad.umd.min.js" onLoad={handleScriptLoad} />
      <Script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2" onLoad={handleScriptLoad} />

      <style jsx global>{styles}</style>

      <div className="container">
        <div className="header">
          <h1 className="clinic-name">RANGE MEDICAL</h1>
          <h2 className="form-title">Red Light Therapy Consent</h2>
          <p>Please answer all questions and read carefully before signing</p>
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
              <button type="submit" className="btn-submit" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit Form'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

const styles = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  
  body {
    font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
    background-color: #f5f5f5;
    color: #171717;
    line-height: 1.6;
    min-height: 100vh;
  }
  
  .container { max-width: 800px; margin: 0 auto; padding: 2rem 1.5rem; }
  
  .header {
    text-align: center;
    margin-bottom: 2.5rem;
    padding-bottom: 2rem;
    border-bottom: 2px solid #000;
  }
  
  .clinic-name {
    font-size: 2.5rem;
    font-weight: 700;
    letter-spacing: 0.15em;
    margin-bottom: 0.5rem;
    color: #000;
  }
  
  .form-title {
    font-size: 1.25rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    margin-top: 0.5rem;
    color: #404040;
  }
  
  .header p { color: #525252; font-size: 0.875rem; margin-top: 0.5rem; }
  
  .form-container { background: #fff; border: 2px solid #000; padding: 2rem; }
  
  .section {
    margin-bottom: 2.5rem;
    padding-bottom: 2rem;
    border-bottom: 1px solid #e5e5e5;
  }
  
  .section:last-of-type { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
  
  .section-title {
    font-size: 1.125rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-bottom: 1.5rem;
    padding-bottom: 0.75rem;
    border-bottom: 2px solid #000;
    display: inline-block;
  }
  
  .form-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.25rem;
    margin-bottom: 1.25rem;
  }
  
  .form-group { display: flex; flex-direction: column; }
  
  label {
    font-size: 0.8125rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.5rem;
    color: #404040;
  }
  
  .required { color: #dc2626; margin-left: 2px; }
  
  input[type="text"], input[type="email"], input[type="tel"], input[type="date"], select, textarea {
    width: 100%;
    padding: 0.75rem 1rem;
    font-size: 1rem;
    font-family: inherit;
    border: 1.5px solid #d4d4d4;
    background: #fff;
    color: #171717;
    transition: border-color 0.2s ease;
  }
  
  input:focus, select:focus, textarea:focus {
    outline: none;
    border-color: #000;
    box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.1);
  }
  
  input.error, select.error, textarea.error { border-color: #dc2626; }
  
  .health-question {
    background: #fafafa;
    border: 1.5px solid #d4d4d4;
    padding: 1.25rem;
    margin-bottom: 1.25rem;
  }
  
  .health-question.warning { background: #fff7ed; border-color: #f59e0b; }
  
  .health-question-text {
    font-size: 1rem;
    font-weight: 500;
    margin-bottom: 0.75rem;
    color: #171717;
  }
  
  .health-question-note {
    font-size: 0.875rem;
    color: #525252;
    font-style: italic;
    margin-bottom: 0.75rem;
  }
  
  .radio-group { display: flex; gap: 2rem; flex-wrap: wrap; }
  
  .radio-item { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; }
  
  .radio-item input[type="radio"] {
    width: 1.25rem;
    height: 1.25rem;
    cursor: pointer;
    accent-color: #000;
  }
  
  .radio-item label {
    font-size: 1rem;
    font-weight: 500;
    text-transform: none;
    letter-spacing: normal;
    margin-bottom: 0;
    cursor: pointer;
    color: #262626;
  }
  
  .warning-alert {
    background: #fef3c7;
    border: 2px solid #f59e0b;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    display: none;
  }
  
  .warning-alert.visible { display: block; }
  
  .warning-alert h4 { font-size: 1rem; font-weight: 700; color: #92400e; margin-bottom: 0.5rem; }
  
  .warning-alert p { font-size: 0.9375rem; color: #78350f; }
  
  .consent-text {
    background: #fafafa;
    border: 1.5px solid #d4d4d4;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    line-height: 1.8;
  }
  
  .consent-text h4 {
    font-size: 0.9375rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 1rem;
    margin-top: 1.5rem;
    color: #262626;
  }
  
  .consent-text h4:first-child { margin-top: 0; }
  
  .consent-text p { margin-bottom: 1rem; color: #262626; font-size: 0.9375rem; }
  
  .consent-text ul { margin-left: 1.5rem; margin-bottom: 1rem; }
  
  .consent-text li { margin-bottom: 0.5rem; color: #262626; }
  
  .checkbox-consent {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
    padding: 1rem;
    background: #fafafa;
    border: 1.5px solid #d4d4d4;
  }
  
  .checkbox-consent input[type="checkbox"] {
    width: 1.5rem;
    height: 1.5rem;
    margin-top: 0.25rem;
    cursor: pointer;
    accent-color: #000;
    flex-shrink: 0;
  }
  
  .checkbox-consent label {
    font-size: 0.9375rem;
    font-weight: 500;
    text-transform: none;
    letter-spacing: normal;
    margin-bottom: 0;
    cursor: pointer;
    color: #171717;
    line-height: 1.6;
  }
  
  .checkbox-consent.error { border-color: #dc2626; background: #fef2f2; }
  
  .signature-wrapper { margin-bottom: 1.5rem; }
  
  .signature-label {
    font-size: 0.8125rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.75rem;
    color: #404040;
    display: block;
  }
  
  .signature-pad-container {
    border: 2px solid #d4d4d4;
    background: #fff;
    margin-bottom: 0.75rem;
  }
  
  .signature-pad-container.error { border-color: #dc2626; }
  
  .signature-controls { display: flex; gap: 1rem; }
  
  .btn-clear {
    padding: 0.625rem 1.25rem;
    font-size: 0.875rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border: 1.5px solid #d4d4d4;
    background: #fff;
    color: #404040;
    cursor: pointer;
    font-family: inherit;
  }
  
  .btn-clear:hover { border-color: #000; background: #fafafa; }
  
  .submit-section {
    margin-top: 2rem;
    padding-top: 2rem;
    border-top: 2px solid #e5e5e5;
    text-align: center;
  }
  
  .btn-submit {
    padding: 1rem 3rem;
    font-size: 1rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    border: 2px solid #000;
    background: #000;
    color: #fff;
    cursor: pointer;
    font-family: inherit;
    min-width: 250px;
  }
  
  .btn-submit:hover:not(:disabled) { background: #fff; color: #000; }
  
  .btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }
  
  .status-message {
    padding: 1rem 1.5rem;
    margin-bottom: 1.5rem;
    font-size: 0.9375rem;
    font-weight: 500;
    text-align: center;
  }
  
  .status-message.error { background: #fef2f2; color: #dc2626; border: 1.5px solid #dc2626; }
  
  .status-message.success { background: #f0fdf4; color: #16a34a; border: 1.5px solid #16a34a; }
  
  .status-message.loading { background: #f5f5f5; color: #404040; border: 1.5px solid #d4d4d4; }
  
  .thank-you-page {
    background: #fff;
    border: 2px solid #000;
    padding: 3rem 2rem;
    text-align: center;
  }
  
  .thank-you-icon {
    width: 80px;
    height: 80px;
    background: #000;
    color: #fff;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 3rem;
    margin: 0 auto 2rem;
  }
  
  .thank-you-page h1 { font-size: 2rem; font-weight: 700; margin-bottom: 1rem; color: #000; }
  
  .thank-you-subtitle { font-size: 1.125rem; color: #525252; margin-bottom: 2rem; }
  
  .thank-you-details {
    padding: 2rem;
    background: #fafafa;
    border: 1.5px solid #e5e5e5;
    margin-bottom: 2rem;
  }
  
  .thank-you-details p { margin-bottom: 0.75rem; color: #404040; }
  
  .thank-you-contact { margin-bottom: 2rem; }
  
  .thank-you-contact h3 {
    font-size: 1rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.5rem;
    color: #262626;
  }
  
  .thank-you-contact a { color: #000; text-decoration: underline; }
  
  .thank-you-footer { padding-top: 2rem; border-top: 2px solid #e5e5e5; }
  
  .thank-you-footer p { font-size: 1.5rem; font-weight: 700; letter-spacing: 0.15em; color: #000; }
  
  @media (max-width: 640px) {
    .clinic-name { font-size: 2rem; }
    .form-container { padding: 1.5rem; }
    .form-row { grid-template-columns: 1fr; }
    .radio-group { flex-direction: column; gap: 1rem; }
  }
`;
