import Head from 'next/head';
import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

export default function HBOTConsent() {
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
        <title>Hyperbaric Oxygen Therapy Consent | Range Medical</title>
        <meta name="description" content="HBOT consent form for Range Medical hyperbaric oxygen therapy services." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex, nofollow" />
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
        .form-group.full-width { grid-column: 1 / -1; }
        .consent-container label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 4px; color: #333; text-transform: none; letter-spacing: normal; }
        .consent-container label .required { color: #dc2626; margin-left: 2px; }
        .consent-container input[type="text"],.consent-container input[type="email"],.consent-container input[type="tel"],.consent-container input[type="date"],.consent-container select,.consent-container textarea { width: 100%; padding: 10px 12px; font-size: 14px; font-family: inherit; border: 1px solid #ccc; background: #fff; color: #111; border-radius: 4px; transition: border-color 0.2s ease; }
        .consent-container input:focus,.consent-container select:focus,.consent-container textarea:focus { outline: none; border-color: #000; box-shadow: 0 0 0 2px rgba(0,0,0,0.1); }
        .consent-container input.error,.consent-container select.error,.consent-container textarea.error { border-color: #dc2626; }
        .health-question { background: #fafafa; border: 1px solid #e5e5e5; border-radius: 6px; padding: 16px; margin-bottom: 12px; }
        .health-question.warning { background: #fff7ed; border-color: #f59e0b; }
        .health-question-text { font-size: 14px; font-weight: 600; margin-bottom: 6px; color: #111; line-height: 1.5; }
        .health-question-note { font-size: 12px; color: #666; font-style: italic; margin-bottom: 8px; }
        .radio-group { display: flex; gap: 20px; }
        .radio-item { display: flex; align-items: center; gap: 6px; cursor: pointer; }
        .radio-item input[type="radio"] { width: 1.25rem; height: 1.25rem; cursor: pointer; accent-color: #000; }
        .radio-item label { font-size: 14px; font-weight: 500; text-transform: none; letter-spacing: normal; margin-bottom: 0; cursor: pointer; color: #333; }
        .warning-alert { background: #fef3c7; border: 2px solid #f59e0b; border-radius: 6px; padding: 16px; margin-bottom: 16px; display: none; }
        .warning-alert.visible { display: block; }
        .warning-alert h4 { font-size: 14px; font-weight: 700; color: #92400e; margin-bottom: 4px; }
        .warning-alert p { font-size: 13px; color: #78350f; line-height: 1.5; }
        .consent-text { background: #fafafa; border: 1px solid #e5e5e5; border-radius: 6px; padding: 20px; margin-bottom: 16px; line-height: 1.6; }
        .consent-text h4 { font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px; color: #262626; }
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
        .signature-pad-container { border: 2px solid #000; border-radius: 6px; background: #fff; position: relative; margin-bottom: 8px; overflow: hidden; }
        .signature-pad-container.error { border-color: #dc2626; }
        #signaturePad { display: block; width: 100%; height: 150px; cursor: crosshair; touch-action: none; }
        .signature-placeholder { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); color: #a3a3a3; font-size: 14px; pointer-events: none; text-align: center; }
        .signature-controls { text-align: right; }
        .btn-clear { background: none; border: 1px solid #ccc; padding: 6px 14px; border-radius: 4px; cursor: pointer; font-size: 13px; font-family: inherit; }
        .btn-clear:hover { background: #f5f5f5; }
        .field-error { font-size: 12px; color: #dc2626; margin-top: 4px; display: none; }
        .field-error.visible { display: block; }
        .submit-section { padding-top: 20px; text-align: center; }
        .btn-submit { background: #000; color: #fff; border: none; padding: 14px 48px; font-size: 16px; font-weight: 600; border-radius: 6px; cursor: pointer; letter-spacing: 0.5px; font-family: inherit; min-width: 250px; }
        .btn-submit:hover:not(:disabled) { background: #222; }
        .btn-submit:disabled { background: #999; cursor: not-allowed; }
        .validation-summary { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 1rem 1.5rem; margin-bottom: 1rem; display: none; }
        .validation-summary.visible { display: block; }
        .validation-summary h3 { color: #991b1b; font-size: 0.9375rem; margin-bottom: 0.5rem; }
        .validation-summary ul { margin: 0; padding-left: 1.25rem; color: #dc2626; font-size: 0.875rem; }
        .validation-summary ul li { margin-bottom: 0.25rem; }
        .health-question.has-error { border-color: #dc2626; background: #fef2f2; }
        .status-message { margin-top: 16px; padding: 12px; border-radius: 6px; font-size: 14px; text-align: center; display: none; }
        .status-message.visible { display: block; }
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
        @media (max-width: 640px) { .consent-header { padding: 20px 16px; } .form-container { padding: 0 16px 30px; } .form-row { flex-direction: column; gap: 12px; } .radio-group { flex-direction: column; gap: 10px; } }
      `}</style>

      <div className="consent-container" id="consentContainer">
        <div className="consent-header">
          <h1 className="clinic-name">RANGE MEDICAL</h1>
          <p className="form-title">Hyperbaric Oxygen Therapy — Informed Consent</p>
        </div>
        
        <div className="form-container">
          <div id="statusMessage" className="status-message"></div>
          
          <form id="consentForm">
            {/* Patient Information */}
            <div className="section">
              <h3 className="section-title">Your Information</h3>
              
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
                  <p style={{ fontSize: '0.6rem', color: '#a3a3a3', lineHeight: 1.4, marginTop: '0.25rem' }}>By providing my phone number, I agree to receive texts from Range Medical. Msg &amp; data rates may apply. Up to 10 msg/mo. Reply STOP to opt out. <a href="/terms-of-use" target="_blank" rel="noopener noreferrer" style={{ color: '#a3a3a3', textDecoration: 'underline' }}>Terms</a> &amp; <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" style={{ color: '#a3a3a3', textDecoration: 'underline' }}>Privacy</a>.</p>
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
            
            {/* Health Screening Questions */}
            <div className="section">
              <h3 className="section-title">Health Questions</h3>
              
              <p style={{ marginBottom: '1.5rem', color: 'var(--gray-700)' }}>Please answer these questions. They help us keep you safe.</p>
              
              <div className="warning-alert" id="warningAlert">
                <h4>⚠️ Important</h4>
                <p>Based on your answers, please talk to our staff before your treatment. We want to make sure this treatment is safe for you.</p>
              </div>
              
              {/* Question 1 */}
              <div className="health-question" id="q1">
                <div className="health-question-text">Do you have a collapsed lung right now?</div>
                <div className="health-question-note">(Also called pneumothorax)</div>
                <div className="radio-group">
                  <div className="radio-item">
                    <input type="radio" id="q1-yes" name="q1" value="yes" required />
                    <label htmlFor="q1-yes">Yes</label>
                  </div>
                  <div className="radio-item">
                    <input type="radio" id="q1-no" name="q1" value="no" />
                    <label htmlFor="q1-no">No</label>
                  </div>
                </div>
              </div>
              
              {/* Question 2 */}
              <div className="health-question" id="q2">
                <div className="health-question-text">Do you have a cold, flu, or sinus infection right now?</div>
                <div className="radio-group">
                  <div className="radio-item">
                    <input type="radio" id="q2-yes" name="q2" value="yes" required />
                    <label htmlFor="q2-yes">Yes</label>
                  </div>
                  <div className="radio-item">
                    <input type="radio" id="q2-no" name="q2" value="no" />
                    <label htmlFor="q2-no">No</label>
                  </div>
                </div>
              </div>
              
              {/* Question 3 */}
              <div className="health-question" id="q3">
                <div className="health-question-text">Do you have bad lung problems?</div>
                <div className="health-question-note">(Like COPD or asthma that is not controlled)</div>
                <div className="radio-group">
                  <div className="radio-item">
                    <input type="radio" id="q3-yes" name="q3" value="yes" required />
                    <label htmlFor="q3-yes">Yes</label>
                  </div>
                  <div className="radio-item">
                    <input type="radio" id="q3-no" name="q3" value="no" />
                    <label htmlFor="q3-no">No</label>
                  </div>
                </div>
              </div>
              
              {/* Question 4 */}
              <div className="health-question" id="q4">
                <div className="health-question-text">Do you have a high fever right now?</div>
                <div className="health-question-note">(Temperature over 102°F or 39°C)</div>
                <div className="radio-group">
                  <div className="radio-item">
                    <input type="radio" id="q4-yes" name="q4" value="yes" required />
                    <label htmlFor="q4-yes">Yes</label>
                  </div>
                  <div className="radio-item">
                    <input type="radio" id="q4-no" name="q4" value="no" />
                    <label htmlFor="q4-no">No</label>
                  </div>
                </div>
              </div>
              
              {/* Question 5 */}
              <div className="health-question" id="q5">
                <div className="health-question-text">Do you have seizures that are not controlled with medicine?</div>
                <div className="radio-group">
                  <div className="radio-item">
                    <input type="radio" id="q5-yes" name="q5" value="yes" required />
                    <label htmlFor="q5-yes">Yes</label>
                  </div>
                  <div className="radio-item">
                    <input type="radio" id="q5-no" name="q5" value="no" />
                    <label htmlFor="q5-no">No</label>
                  </div>
                </div>
              </div>
              
              {/* Question 6 */}
              <div className="health-question" id="q6">
                <div className="health-question-text">Have you had ear surgery in the last 3 months?</div>
                <div className="radio-group">
                  <div className="radio-item">
                    <input type="radio" id="q6-yes" name="q6" value="yes" required />
                    <label htmlFor="q6-yes">Yes</label>
                  </div>
                  <div className="radio-item">
                    <input type="radio" id="q6-no" name="q6" value="no" />
                    <label htmlFor="q6-no">No</label>
                  </div>
                </div>
              </div>
              
              {/* Question 7 */}
              <div className="health-question" id="q7">
                <div className="health-question-text">Are you pregnant?</div>
                <div className="radio-group">
                  <div className="radio-item">
                    <input type="radio" id="q7-yes" name="q7" value="yes" required />
                    <label htmlFor="q7-yes">Yes</label>
                  </div>
                  <div className="radio-item">
                    <input type="radio" id="q7-no" name="q7" value="no" />
                    <label htmlFor="q7-no">No</label>
                  </div>
                  <div className="radio-item">
                    <input type="radio" id="q7-na" name="q7" value="n/a" />
                    <label htmlFor="q7-na">Does not apply</label>
                  </div>
                </div>
              </div>
              
              {/* Question 8 */}
              <div className="health-question" id="q8">
                <div className="health-question-text">Do you have a medical device in your body?</div>
                <div className="health-question-note">(Like a pacemaker, insulin pump, or pain pump)</div>
                <div className="radio-group">
                  <div className="radio-item">
                    <input type="radio" id="q8-yes" name="q8" value="yes" required />
                    <label htmlFor="q8-yes">Yes</label>
                  </div>
                  <div className="radio-item">
                    <input type="radio" id="q8-no" name="q8" value="no" />
                    <label htmlFor="q8-no">No</label>
                  </div>
                </div>
              </div>
              
              {/* Question 9 */}
              <div className="health-question" id="q9">
                <div className="health-question-text">Are you taking chemotherapy medicine?</div>
                <div className="health-question-note">(Especially doxorubicin, bleomycin, or cisplatin)</div>
                <div className="radio-group">
                  <div className="radio-item">
                    <input type="radio" id="q9-yes" name="q9" value="yes" required />
                    <label htmlFor="q9-yes">Yes</label>
                  </div>
                  <div className="radio-item">
                    <input type="radio" id="q9-no" name="q9" value="no" />
                    <label htmlFor="q9-no">No</label>
                  </div>
                </div>
              </div>
              
              {/* Question 10 */}
              <div className="health-question" id="q10">
                <div className="health-question-text">Are you taking a medicine called Antabuse?</div>
                <div className="health-question-note">(Also called disulfiram - used to treat alcohol problems)</div>
                <div className="radio-group">
                  <div className="radio-item">
                    <input type="radio" id="q10-yes" name="q10" value="yes" required />
                    <label htmlFor="q10-yes">Yes</label>
                  </div>
                  <div className="radio-item">
                    <input type="radio" id="q10-no" name="q10" value="no" />
                    <label htmlFor="q10-no">No</label>
                  </div>
                </div>
              </div>
              
              {/* Question 11 */}
              <div className="health-question" id="q11">
                <div className="health-question-text">Are you scared of small or tight spaces?</div>
                <div className="health-question-note">(Claustrophobia)</div>
                <div className="radio-group">
                  <div className="radio-item">
                    <input type="radio" id="q11-yes" name="q11" value="yes" required />
                    <label htmlFor="q11-yes">Yes</label>
                  </div>
                  <div className="radio-item">
                    <input type="radio" id="q11-no" name="q11" value="no" />
                    <label htmlFor="q11-no">No</label>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Consent Information */}
            <div className="section">
              <h3 className="section-title">Treatment Information</h3>
              
              <div className="consent-text">
                <h4>What This Treatment Does</h4>
                <p>Hyperbaric Oxygen Therapy (HBOT) means breathing pure oxygen inside a special room. The room has more air pressure than normal. This helps your body get more oxygen. More oxygen can help your body heal and feel better.</p>
                
                <h4>How It Works</h4>
                <p>You will sit or lie down in a special chamber. The air pressure will be higher than normal. This lets your lungs take in more oxygen. The extra oxygen goes all through your body and can help you heal.</p>
                
                <h4>What It Might Help With</h4>
                <p>This treatment might help you:</p>
                <ul>
                  <li>Heal faster</li>
                  <li>Have less swelling</li>
                  <li>Get more oxygen to hurt or sick parts of your body</li>
                  <li>Have more energy and think more clearly</li>
                  <li>Feel better after surgery</li>
                </ul>
                <p><strong>Important:</strong> This treatment works differently for everyone. We cannot promise it will cure any sickness.</p>
                
                <h4>Things That Might Happen</h4>
                <p>Most people do fine with this treatment. But some things might happen:</p>
                <ul>
                  <li>Your ears might hurt (like when you fly in a plane)</li>
                  <li>Your eyes might change for a little while (things might look blurry)</li>
                  <li>You might feel nervous in the chamber</li>
                  <li>You might feel tired after treatment</li>
                  <li>Very rare: lung problems or seizures</li>
                </ul>
                <p>Our staff will teach you how to make your ears feel better. Tell us right away if something hurts or feels wrong.</p>
                
                <h4>What You Need To Do</h4>
                <ul>
                  <li>Come on time for your appointments</li>
                  <li>Take off anything that could catch fire (no oils, lotions, or hair products)</li>
                  <li>Do not bring phones or electronics into the chamber</li>
                  <li>Tell us if something feels wrong during treatment</li>
                  <li>Follow all safety rules</li>
                </ul>
                
                <h4>How Long Treatment Takes</h4>
                <p>Each treatment takes about 60 to 90 minutes. Your doctor will tell you how many treatments you need. You can do normal things after treatment unless your doctor says not to.</p>
              </div>
              
              <div className="checkbox-consent" id="consentCheckbox">
                <input type="checkbox" id="consentGiven" name="consentGiven" required />
                <label htmlFor="consentGiven">
                  <strong>I understand and agree:</strong> I have read this form (or someone read it to me). I understand what HBOT is and what might happen. I know it might not work for me. I can ask questions if I want. I agree to get HBOT treatment at Range Medical. I will not blame Range Medical if something goes wrong, unless they did something very bad on purpose.
                </label>
              </div>
              <div className="field-error" id="consentError">You must agree to continue</div>
            </div>
            
            {/* Signature */}
            <div className="section">
              <h3 className="section-title">Your Signature</h3>
              
              <div className="signature-wrapper">
                <span className="signature-label">Sign Below <span className="required">*</span></span>
                <div className="signature-pad-container" id="signatureContainer">
                  <canvas id="signaturePad"></canvas>
                  <div className="signature-placeholder" id="signaturePlaceholder">Sign here with your mouse or finger</div>
                </div>
                <div className="field-error" id="signatureError">Please sign your name</div>
                <div className="signature-controls">
                  <button type="button" className="btn-clear" id="clearSignature">Clear Signature</button>
                </div>
              </div>
              
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginTop: '1rem' }}>
                By signing, I agree that I read and understand this form. I agree to get HBOT treatment at Range Medical.
              </p>
            </div>
            
            {/* Submit */}
            <div className="submit-section">
              <div className="validation-summary" id="validationSummary">
                <h3>Please complete the following required fields:</h3>
                <ul id="validationList"></ul>
              </div>
              <button type="submit" className="btn-submit" id="submitBtn">Submit Form</button>
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

  // ============================================
  // CONFIGURATION
  // ============================================
  const CONFIG = {
    supabase: {
      url: 'https://teivfptpozltpqwahgdl.supabase.co',
      anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlaXZmcHRwb3psdHBxd2FoZ2RsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3MTMxNDksImV4cCI6MjA4MDI4OTE0OX0.NrI1AykMBOh91mM9BFvpSH0JwzGrkv5ADDkZinh0elc'
    },
    api: {
      consents: '/api/consent-forms',
      ghl: '/api/consent-to-ghl'
    },
    ghl: {
      customFieldKey: 'hbot_consent',
      tags: ['hbot-consent-signed', 'consent-completed']
    },
    consentType: 'hbot',
    recipientEmail: 'cupp@range-medical.com, intake@range-medical.com'
  };

  const urlParams = new URLSearchParams(window.location.search);
  const ghlContactId = urlParams.get('contactId') || urlParams.get('contact_id') || urlParams.get('cid') || '';

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

  // ============================================
  // HEALTH SCREENING LOGIC
  // ============================================
  function checkHealthQuestions() {
    const warningQuestions = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9', 'q10'];
    let showWarning = false;
    
    warningQuestions.forEach(questionName => {
      const yesRadio = document.getElementById(questionName + '-yes');
      if (yesRadio && yesRadio.checked) {
        showWarning = true;
        document.getElementById(questionName).classList.add('warning');
      } else {
        document.getElementById(questionName).classList.remove('warning');
      }
    });
    
    const warningAlert = document.getElementById('warningAlert');
    if (showWarning) {
      warningAlert.classList.add('visible');
    } else {
      warningAlert.classList.remove('visible');
    }
  }

  // Add listeners to health questions
  for (let i = 1; i <= 11; i++) {
    const radios = document.querySelectorAll(`input[name="q${i}"]`);
    radios.forEach(radio => {
      radio.addEventListener('change', checkHealthQuestions);
    });
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
    const missingFields = [];

    // Clear previous validation summary
    const summaryEl = document.getElementById('validationSummary');
    const listEl = document.getElementById('validationList');
    summaryEl.classList.remove('visible');
    listEl.innerHTML = '';
    document.querySelectorAll('.health-question.has-error').forEach(el => el.classList.remove('has-error'));

    const fieldLabels = { firstName: 'First Name', lastName: 'Last Name', email: 'Email', phone: 'Phone', consentDate: 'Consent Date' };
    const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'consentDate'];
    requiredFields.forEach(fieldId => {
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

    const dob = document.getElementById('dateOfBirth');
    const dobError = document.getElementById('dateOfBirthError');
    if (!dob.value.trim() || !isValidDOB(dob.value)) {
      dob.classList.add('error');
      if (dobError) dobError.classList.add('visible');
      isValid = false;
      missingFields.push('Date of Birth');
    } else {
      dob.classList.remove('error');
      if (dobError) dobError.classList.remove('visible');
    }

    // Validate all health questions
    const questionLabels = {
      q1: 'Collapsed lung', q2: 'Cold/flu/sinus infection', q3: 'Lung problems',
      q4: 'High fever', q5: 'Seizures', q6: 'Recent ear surgery',
      q7: 'Pregnant', q8: 'Medical device', q9: 'Chemotherapy',
      q10: 'Antabuse/disulfiram', q11: 'Claustrophobia'
    };
    const unanswered = [];
    for (let i = 1; i <= 11; i++) {
      const name = 'q' + i;
      const radios = document.querySelectorAll(`input[name="${name}"]`);
      const anyChecked = Array.from(radios).some(radio => radio.checked);
      if (!anyChecked) {
        isValid = false;
        unanswered.push(questionLabels[name]);
        const questionEl = document.getElementById(name);
        if (questionEl) questionEl.classList.add('has-error');
      }
    }
    if (unanswered.length > 0) {
      missingFields.push('Health Questions: ' + unanswered.join(', '));
    }

    // Validate consent
    const consentCheckbox = document.getElementById('consentGiven');
    if (!consentCheckbox.checked) {
      document.getElementById('consentCheckbox').classList.add('error');
      document.getElementById('consentError').classList.add('visible');
      isValid = false;
      missingFields.push('Consent Checkbox');
    }

    // Validate signature
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
    const healthAnswers = {};
    for (let i = 1; i <= 11; i++) {
      const checked = document.querySelector(`input[name="q${i}"]:checked`);
      healthAnswers[`q${i}`] = checked ? checked.value : 'not answered';
    }
    
    return {
      firstName: document.getElementById('firstName').value.trim(),
      lastName: document.getElementById('lastName').value.trim(),
      email: document.getElementById('email').value.trim(),
      phone: document.getElementById('phone').value.trim(),
      dateOfBirth: document.getElementById('dateOfBirth').value,
      consentDate: document.getElementById('consentDate').value,
      healthAnswers: healthAnswers,
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
  async function uploadSignatureToSupabase(signatureDataUrl, firstName, lastName) {
    const response = await fetch(signatureDataUrl);
    const blob = await response.blob();

    const timestamp = Date.now();
    const fileName = `signatures/${firstName}-${lastName}-${timestamp}.jpg`;
    
    const { data, error } = await supabaseClient.storage
      .from('medical-documents')
      .upload(fileName, blob, { contentType: 'image/jpeg', upsert: false });
    
    if (error) throw new Error('Failed to upload signature: ' + error.message);
    
    const { data: urlData } = supabaseClient.storage
      .from('medical-documents')
      .getPublicUrl(fileName);
    
    return urlData.publicUrl;
  }

  async function uploadPDFToSupabase(pdfBlob, firstName, lastName) {
    const timestamp = Date.now();
    const fileName = `consents/hbot-consent-${firstName}-${lastName}-${timestamp}.pdf`;
    
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
      consentGiven: formData.consentGiven,
      healthAnswers: formData.healthAnswers,
      ghlContactId: ghlContactId
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
    const questions = [
      'Collapsed lung', 'Cold/flu/sinus infection', 'Severe lung problems',
      'High fever', 'Uncontrolled seizures', 'Recent ear surgery',
      'Pregnancy', 'Implanted medical device', 'Chemotherapy medication',
      'Taking Antabuse', 'Claustrophobia'
    ];
    
    const yesAnswers = [];
    questions.forEach((question, index) => {
      const answer = formData.healthAnswers[`q${index + 1}`];
      if (answer === 'yes') yesAnswers.push(question);
    });
    
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
      pdfUrl: pdfUrl,
      healthScreening: { yesAnswers: yesAnswers }
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

    function addBullet(text) {
      checkPageBreak(8);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      var lines = doc.splitTextToSize('• ' + text, contentWidth - 5);
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
    doc.text('Hyperbaric Oxygen Therapy — Informed Consent', leftMargin, 16);
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
    addText('Hyperbaric Oxygen Therapy (HBOT) means breathing pure oxygen inside a special room. The room has more air pressure than normal. This helps your body get more oxygen. More oxygen can help your body heal and feel better.', 8.5);
    yPos += 2;
    addText('How It Works:', 9, true);
    addText('You will sit or lie down in a special chamber. The air pressure will be higher than normal. This lets your lungs take in more oxygen. The extra oxygen goes all through your body and can help you heal.', 8.5);
    yPos += 2;
    addText('What It Might Help With:', 9, true);
    addBullet('Heal faster');
    addBullet('Have less swelling');
    addBullet('Get more oxygen to hurt or sick parts of your body');
    addBullet('Have more energy and think more clearly');
    addBullet('Feel better after surgery');
    yPos += 1;
    addText('Important: This treatment works differently for everyone. We cannot promise it will cure any sickness.', 8.5, true);
    yPos += 2;

    // ========== HEALTH SCREENING ==========
    addSectionHeader('Health Screening Responses');

    var questions = [
      'Collapsed lung (pneumothorax)',
      'Cold, flu, or sinus infection',
      'Severe lung problems (COPD/uncontrolled asthma)',
      'High fever (over 102°F / 39°C)',
      'Uncontrolled seizures',
      'Ear surgery in the last 3 months',
      'Pregnant',
      'Implanted medical device (pacemaker, insulin pump, etc.)',
      'Taking chemotherapy medication',
      'Taking Antabuse (disulfiram)',
      'Claustrophobia'
    ];

    var yesAnswers = [];
    questions.forEach(function(question, index) {
      var answer = formData.healthAnswers['q' + (index + 1)];
      if (answer === 'yes') yesAnswers.push(question);
    });

    if (yesAnswers.length > 0) {
      checkPageBreak(12 + yesAnswers.length * 5);
      doc.setFillColor(254, 243, 199);
      var boxHeight = 10 + (yesAnswers.length * 5);
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
      yesAnswers.forEach(function(q) {
        doc.text('• ' + q, leftMargin + 6, yPos);
        yPos += 4.5;
      });
      doc.setTextColor(0, 0, 0);
      doc.setDrawColor(0);
      yPos += 4;
    }

    questions.forEach(function(question, index) {
      var answer = formData.healthAnswers['q' + (index + 1)];
      addLabelValue((index + 1) + '. ' + question + ': ', (answer || 'not answered').toUpperCase());
    });
    yPos += 2;

    // ========== RISKS ==========
    addSectionHeader('Things That Might Happen');
    addText('Most people do fine with this treatment. But some things might happen:', 8.5);
    addBullet('Your ears might hurt (like when you fly in a plane)');
    addBullet('Your eyes might change for a little while (things might look blurry)');
    addBullet('You might feel nervous in the chamber');
    addBullet('You might feel tired after treatment');
    addBullet('Very rare: lung problems or seizures');
    yPos += 1;
    addText('Our staff will teach you how to make your ears feel better. Tell us right away if something hurts or feels wrong.', 8.5);
    yPos += 2;

    // ========== PATIENT RESPONSIBILITIES ==========
    addSectionHeader('What You Need To Do');
    addBullet('Come on time for your appointments');
    addBullet('Take off anything that could catch fire (no oils, lotions, or hair products)');
    addBullet('Do not bring phones or electronics into the chamber');
    addBullet('Tell us if something feels wrong during treatment');
    addBullet('Follow all safety rules');
    yPos += 1;
    addText('How Long Treatment Takes: Each treatment takes about 60 to 90 minutes. Your doctor will tell you how many treatments you need. You can do normal things after treatment unless your doctor says not to.', 8.5);
    yPos += 4;

    // ========== CONSENT ACKNOWLEDGMENT ==========
    addSectionHeader('Consent Acknowledgment');
    addText('I understand and agree: I have read this form (or someone read it to me). I understand what HBOT is and what might happen. I know it might not work for me. I can ask questions if I want. I agree to get HBOT treatment at Range Medical. I will not blame Range Medical if something goes wrong, unless they did something very bad on purpose.', 8.5, true);
    yPos += 4;

    // ========== PATIENT SIGNATURE ==========
    addSectionHeader('Patient Signature');
    addText('By affixing my signature below, I certify that I have read this consent form in its entirety, that all of my questions have been answered to my satisfaction, and that I voluntarily consent to Hyperbaric Oxygen Therapy at Range Medical.', 8.5);
    yPos += 3;
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

    // ========== FOOTER ON ALL PAGES ==========
    var totalPages = doc.internal.getNumberOfPages();
    for (var i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(130);
      doc.text('Page ' + i + ' of ' + totalPages, pageWidth - 15, pageHeight - 4, { align: 'right' });
      doc.text('Range Medical | 1901 Westcliff Dr, Suite 10, Newport Beach, CA 92660 | (949) 997-3988', pageWidth / 2, pageHeight - 8, { align: 'center' });
      doc.text('CONFIDENTIAL — HBOT Consent', pageWidth / 2, pageHeight - 4, { align: 'center' });
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
    document.getElementById('consentContainer').innerHTML = `
      <div class="thank-you-page">
        <div class="thank-you-icon">✓</div>
        <h1>Thank You, ${formData.firstName}!</h1>
        <p class="thank-you-subtitle">Your form has been sent.</p>
        <div class="thank-you-details">
          <p>We got your HBOT consent form.</p>
          <p>Our team will look at it before your treatment.</p>
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  document.getElementById('consentForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';
    showStatus('Sending your form...', 'loading');
    
    try {
      const formData = collectFormData();
      const patientName = `${formData.firstName} ${formData.lastName}`;
      
      showStatus('Uploading signature...', 'loading');
      const signatureUrl = await uploadSignatureToSupabase(formData.signature, formData.firstName, formData.lastName);

      showStatus('Making PDF...', 'loading');
      const pdfBlob = generatePDF(formData);

      showStatus('Uploading PDF...', 'loading');
      const pdfUrl = await uploadPDFToSupabase(pdfBlob, formData.firstName, formData.lastName);
      
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
      
      showThankYouPage(formData);
      
    } catch (error) {
      console.error('Error:', error);
      showStatus('Error: ' + error.message, 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Form';
    }
  });
}
