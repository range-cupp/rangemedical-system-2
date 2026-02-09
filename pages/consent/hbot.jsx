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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <Script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js" onLoad={handleScriptLoad} />

      <Script src="https://cdn.jsdelivr.net/npm/signature_pad@4.1.7/dist/signature_pad.umd.min.js" onLoad={handleScriptLoad} />
      <Script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2" onLoad={handleScriptLoad} />

      <style jsx global>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        :root{--black:#000;--white:#fff;--gray-50:#fafafa;--gray-100:#f5f5f5;--gray-200:#e5e5e5;--gray-300:#d4d4d4;--gray-400:#a3a3a3;--gray-500:#737373;--gray-600:#525252;--gray-700:#404040;--gray-800:#262626;--gray-900:#171717;--error:#dc2626;--success:#16a34a;--warning:#f59e0b}
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
        .health-question{background:var(--gray-50);border:1.5px solid var(--gray-300);padding:1.25rem;margin-bottom:1.25rem}
        .health-question.warning{background:#fff7ed;border-color:var(--warning)}
        .health-question-text{font-size:1rem;font-weight:500;margin-bottom:.75rem;color:var(--gray-900);line-height:1.6}
        .health-question-note{font-size:.875rem;color:var(--gray-600);font-style:italic;margin-bottom:.75rem}
        .radio-group{display:flex;gap:2rem}
        .radio-item{display:flex;align-items:center;gap:.5rem;cursor:pointer}
        .radio-item input[type="radio"]{width:1.25rem;height:1.25rem;cursor:pointer;accent-color:var(--black)}
        .radio-item label{font-size:1rem;font-weight:500;text-transform:none;letter-spacing:normal;margin-bottom:0;cursor:pointer;color:var(--gray-800)}
        .warning-alert{background:#fef3c7;border:2px solid var(--warning);padding:1.5rem;margin-bottom:1.5rem;display:none}
        .warning-alert.visible{display:block}
        .warning-alert h4{font-size:1rem;font-weight:700;color:#92400e;margin-bottom:.5rem}
        .warning-alert p{font-size:.9375rem;color:#78350f;line-height:1.6}
        .consent-text{background:var(--gray-50);border:1.5px solid var(--gray-300);padding:1.5rem;margin-bottom:1.5rem;line-height:1.8}
        .consent-text h4{font-size:.9375rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em;margin-bottom:1rem;color:var(--gray-800)}
        .consent-text p{margin-bottom:1rem;color:var(--gray-800);font-size:.9375rem}
        .consent-text p:last-child{margin-bottom:0}
        .consent-text ul{margin-left:1.5rem;margin-bottom:1rem}
        .consent-text li{margin-bottom:.5rem;color:var(--gray-800)}
        .consent-text strong{font-weight:600}
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
        .validation-summary{background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:1rem 1.5rem;margin-bottom:1rem;display:none}
        .validation-summary.visible{display:block}
        .validation-summary h3{color:#991b1b;font-size:.9375rem;margin-bottom:.5rem}
        .validation-summary ul{margin:0;padding-left:1.25rem;color:#dc2626;font-size:.875rem}
        .validation-summary ul li{margin-bottom:.25rem}
        .health-question.has-error{border-color:#dc2626;background:#fef2f2}
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
        @media(max-width:640px){.clinic-name{font-size:2rem}.form-container{padding:1.5rem}.form-row{grid-template-columns:1fr}.radio-group{flex-direction:column;gap:1rem}}
      `}</style>

      <div className="consent-container" id="consentContainer">
        <div className="consent-header">
          <h1 className="clinic-name">RANGE MEDICAL</h1>
          <h2 className="form-title">Hyperbaric Oxygen Therapy Consent</h2>
          <p>Please answer all questions and read carefully before signing</p>
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
  async function uploadSignatureToSupabase(signatureDataUrl, patientName) {
    const response = await fetch(signatureDataUrl);
    const blob = await response.blob();
    
    const timestamp = Date.now();
    const safeName = patientName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const fileName = `signatures/hbot-consent/${safeName}-${timestamp}.jpg`;
    
    const { data, error } = await supabaseClient.storage
      .from('medical-documents')
      .upload(fileName, blob, { contentType: 'image/jpeg', upsert: false });
    
    if (error) throw new Error('Failed to upload signature: ' + error.message);
    
    const { data: urlData } = supabaseClient.storage
      .from('medical-documents')
      .getPublicUrl(fileName);
    
    return urlData.publicUrl;
  }

  async function uploadPDFToSupabase(pdfBlob, patientName) {
    const timestamp = Date.now();
    const safeName = patientName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const fileName = `consents/hbot-consent/${safeName}-${timestamp}.pdf`;
    
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
      healthAnswers: formData.healthAnswers
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
    doc.text('Hyperbaric Oxygen Therapy Consent', pageWidth / 2, yPos, { align: 'center' });
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
    
    // Health Screening
    yPos += 15;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('HEALTH SCREENING ANSWERS', margin, yPos);
    
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
    
    if (yesAnswers.length > 0) {
      yPos += 10;
      doc.setFillColor(255, 243, 205);
      const boxHeight = 8 + (yesAnswers.length * 6);
      doc.rect(margin, yPos - 5, pageWidth - 2 * margin, boxHeight, 'F');
      doc.setDrawColor(245, 158, 11);
      doc.setLineWidth(1);
      doc.rect(margin, yPos - 5, pageWidth - 2 * margin, boxHeight, 'S');
      
      doc.setTextColor(146, 64, 14);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('⚠ ATTENTION: Patient answered YES to:', margin + 5, yPos);
      yPos += 6;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
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
    
    questions.forEach((question, index) => {
      const answer = formData.healthAnswers[`q${index + 1}`];
      doc.text(`${index + 1}. ${question}: ${answer.toUpperCase()}`, margin, yPos);
      yPos += 6;
      if (yPos > pageHeight - 40) {
        doc.addPage();
        yPos = margin;
      }
    });
    
    // Consent
    yPos += 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('PATIENT CONSENT', margin, yPos);
    yPos += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const consent = 'I have read and understand the treatment information. I agree to receive Hyperbaric Oxygen Therapy at Range Medical.';
    const consentLines = doc.splitTextToSize(consent, pageWidth - 2 * margin);
    doc.text(consentLines, margin, yPos);
    yPos += consentLines.length * 5 + 10;
    
    if (yPos > pageHeight - 60) {
      doc.addPage();
      yPos = margin;
    }
    
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
      const signatureUrl = await uploadSignatureToSupabase(formData.signature, patientName);
      
      showStatus('Making PDF...', 'loading');
      const pdfBlob = generatePDF(formData);
      
      showStatus('Uploading PDF...', 'loading');
      const pdfUrl = await uploadPDFToSupabase(pdfBlob, patientName);
      
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
