import Head from 'next/head';
import { useState } from 'react';

export default function HIPAANotice() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    acknowledged: false
  });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Auto-format DOB
  const handleDOBChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length >= 2) value = value.slice(0, 2) + '/' + value.slice(2);
    if (value.length >= 5) value = value.slice(0, 5) + '/' + value.slice(5);
    if (value.length > 10) value = value.slice(0, 10);
    setFormData(prev => ({ ...prev, dateOfBirth: value }));
  };

  const isValidDOB = (dateStr) => {
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return false;
    const [month, day, year] = dateStr.split('/').map(Number);
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && 
           date.getMonth() === month - 1 && 
           date.getDate() === day &&
           year >= 1900 && year <= new Date().getFullYear();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isValidDOB(formData.dateOfBirth)) {
      setStatus({ type: 'error', message: 'Please enter a valid date of birth (MM/DD/YYYY)' });
      return;
    }

    if (!formData.acknowledged) {
      setStatus({ type: 'error', message: 'Please acknowledge receipt of the privacy notice' });
      return;
    }

    setLoading(true);
    setStatus({ type: 'loading', message: 'Submitting...' });

    try {
      // Save to database
      await fetch('/api/consent-forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consentType: 'hipaa',
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          dateOfBirth: formData.dateOfBirth,
          consentDate: new Date().toISOString().split('T')[0],
          consentGiven: formData.acknowledged
        })
      });

      // Sync to GHL
      await fetch('/api/consent-to-ghl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          dateOfBirth: formData.dateOfBirth,
          consentType: 'hipaa',
          consentDate: new Date().toISOString().split('T')[0],
          customFieldKey: 'hipaa_acknowledged',
          customFieldValue: 'Complete',
          tags: ['hipaa-acknowledged']
        })
      });

      setSubmitted(true);
    } catch (error) {
      console.error('Error:', error);
      setStatus({ type: 'error', message: 'Something went wrong. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <>
        <Head>
          <title>HIPAA Acknowledged | Range Medical</title>
          <meta name="robots" content="noindex, nofollow" />
          <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
        </Head>
        <style jsx global>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'DM Sans', -apple-system, sans-serif; background: #f5f5f5; min-height: 100vh; }
        `}</style>
        <style jsx>{`
          .container { max-width: 600px; margin: 0 auto; padding: 2rem 1.5rem; }
          .card { background: #fff; border: 2px solid #000; padding: 3rem 2rem; text-align: center; }
          .icon { width: 80px; height: 80px; background: #000; color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2.5rem; margin: 0 auto 1.5rem; }
          h1 { font-size: 1.75rem; margin-bottom: 0.5rem; }
          .subtitle { color: #525252; margin-bottom: 2rem; }
          .details { background: #f5f5f5; padding: 1.5rem; margin-bottom: 2rem; text-align: left; }
          .details p { margin-bottom: 0.5rem; color: #404040; }
          .footer { padding-top: 1.5rem; border-top: 2px solid #e5e5e5; }
          .footer p { font-size: 1.25rem; font-weight: 700; letter-spacing: 0.1em; }
        `}</style>
        <div className="container">
          <div className="card">
            <div className="icon">✓</div>
            <h1>Thank You, {formData.firstName}!</h1>
            <p className="subtitle">Your acknowledgment has been recorded.</p>
            <div className="details">
              <p>You have acknowledged receipt of the Range Medical Notice of Privacy Practices.</p>
              <p>A copy of this notice is available at our office or upon request.</p>
            </div>
            <div className="footer">
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
        <title>HIPAA Privacy Notice | Range Medical</title>
        <meta name="description" content="HIPAA Notice of Privacy Practices for Range Medical." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex, nofollow" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <style jsx global>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', -apple-system, sans-serif; background: #f5f5f5; min-height: 100vh; line-height: 1.6; }
      `}</style>

      <style jsx>{`
        .container { max-width: 800px; margin: 0 auto; padding: 2rem 1.5rem; }
        .header { text-align: center; margin-bottom: 2rem; padding-bottom: 1.5rem; border-bottom: 2px solid #000; }
        .logo { font-size: 2.5rem; font-weight: 700; letter-spacing: 0.15em; }
        .title { font-size: 1.25rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #404040; margin-top: 0.5rem; }
        .card { background: #fff; border: 2px solid #000; padding: 2rem; margin-bottom: 1.5rem; }
        .section-title { font-size: 1rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 2px solid #000; display: inline-block; }
        .row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem; }
        .field { display: flex; flex-direction: column; }
        .label { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #404040; margin-bottom: 0.5rem; }
        .required { color: #dc2626; }
        .input { padding: 0.75rem 1rem; font-size: 1rem; font-family: inherit; border: 1.5px solid #d4d4d4; }
        .input:focus { outline: none; border-color: #000; box-shadow: 0 0 0 3px rgba(0,0,0,0.1); }
        .input:disabled { background: #f5f5f5; color: #737373; }
        .notice { background: #fafafa; border: 1.5px solid #d4d4d4; padding: 1.5rem; margin-bottom: 1.5rem; max-height: 400px; overflow-y: auto; }
        .notice h4 { font-size: 0.875rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin: 1.5rem 0 0.75rem; color: #262626; }
        .notice h4:first-child { margin-top: 0; }
        .notice p { margin-bottom: 0.75rem; color: #404040; font-size: 0.9375rem; }
        .notice ul { margin-left: 1.5rem; margin-bottom: 0.75rem; }
        .notice li { margin-bottom: 0.5rem; color: #404040; font-size: 0.9375rem; }
        .checkbox-row { display: flex; align-items: flex-start; gap: 0.75rem; padding: 1rem; background: #fafafa; border: 1.5px solid #d4d4d4; }
        .checkbox-row.error { border-color: #dc2626; background: #fef2f2; }
        .checkbox { width: 1.5rem; height: 1.5rem; margin-top: 0.125rem; accent-color: #000; cursor: pointer; flex-shrink: 0; }
        .checkbox-label { font-size: 0.9375rem; cursor: pointer; color: #171717; }
        .btn { width: 100%; padding: 1rem; font-size: 1rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; border: 2px solid #000; background: #000; color: #fff; cursor: pointer; font-family: inherit; transition: all 0.2s; margin-top: 1.5rem; }
        .btn:hover:not(:disabled) { background: #fff; color: #000; }
        .btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .status { margin-top: 1rem; padding: 1rem; text-align: center; font-weight: 500; }
        .status-error { background: #fef2f2; color: #dc2626; border: 1px solid #dc2626; }
        .status-loading { background: #f5f5f5; color: #525252; border: 1px solid #d4d4d4; }
        .contact-box { background: #f5f5f5; padding: 1rem; margin-top: 1rem; }
        .contact-box p { margin-bottom: 0.25rem; font-size: 0.875rem; color: #525252; }
        @media (max-width: 600px) { .row { grid-template-columns: 1fr; } }
      `}</style>

      <div className="container">
        <div className="header">
          <h1 className="logo">RANGE MEDICAL</h1>
          <h2 className="title">Notice of Privacy Practices</h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="card">
            <h3 className="section-title">Your Information</h3>
            
            <div className="row">
              <div className="field">
                <label className="label">First Name <span className="required">*</span></label>
                <input type="text" name="firstName" className="input" value={formData.firstName} onChange={handleChange} required />
              </div>
              <div className="field">
                <label className="label">Last Name <span className="required">*</span></label>
                <input type="text" name="lastName" className="input" value={formData.lastName} onChange={handleChange} required />
              </div>
            </div>

            <div className="row">
              <div className="field">
                <label className="label">Email <span className="required">*</span></label>
                <input type="email" name="email" className="input" value={formData.email} onChange={handleChange} required />
              </div>
              <div className="field">
                <label className="label">Phone <span className="required">*</span></label>
                <input type="tel" name="phone" className="input" value={formData.phone} onChange={handleChange} required />
              </div>
            </div>

            <div className="row">
              <div className="field">
                <label className="label">Date of Birth <span className="required">*</span></label>
                <input type="text" name="dateOfBirth" className="input" placeholder="MM/DD/YYYY" maxLength="10" value={formData.dateOfBirth} onChange={handleDOBChange} required />
              </div>
              <div className="field">
                <label className="label">Today's Date</label>
                <input type="text" className="input" value={new Date().toLocaleDateString()} disabled />
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="section-title">Privacy Notice</h3>
            
            <div className="notice">
              <p><strong>Effective Date: January 1, 2025</strong></p>
              <p>This notice describes how medical information about you may be used and disclosed and how you can get access to this information. Please review it carefully.</p>

              <h4>Our Commitment to Your Privacy</h4>
              <p>Range Medical is committed to protecting your health information. We are required by law to maintain the privacy of your protected health information (PHI), provide you with this notice of our legal duties and privacy practices, and notify you if there is a breach of your unsecured PHI.</p>

              <h4>How We May Use and Disclose Your Health Information</h4>
              <ul>
                <li><strong>Treatment:</strong> We use your health information to provide, coordinate, or manage your care with other healthcare providers.</li>
                <li><strong>Payment:</strong> We may use and share your health information to bill and receive payment for services.</li>
                <li><strong>Healthcare Operations:</strong> We may use your information to run our practice, improve your care, and train staff.</li>
                <li><strong>As Required by Law:</strong> We will share information when required by federal, state, or local law.</li>
                <li><strong>Public Health & Safety:</strong> We may share information to prevent disease or serious threats to health or safety.</li>
              </ul>

              <h4>Your Rights</h4>
              <ul>
                <li><strong>Access:</strong> You may request copies of your health records.</li>
                <li><strong>Amendment:</strong> You may request corrections to your information.</li>
                <li><strong>Accounting:</strong> You may request a list of certain disclosures we have made.</li>
                <li><strong>Restrictions:</strong> You may ask us to limit how we use your information.</li>
                <li><strong>Confidential Communications:</strong> You may ask us to contact you in a specific way.</li>
                <li><strong>Paper Copy:</strong> You may request a paper copy of this notice at any time.</li>
              </ul>

              <h4>Our Responsibilities</h4>
              <p>We are required by law to maintain the privacy and security of your protected health information and notify you if there is a breach. We will not use or share your information other than as described here unless you authorize us in writing.</p>

              <h4>Questions or Complaints</h4>
              <p>If you have questions or believe your privacy rights have been violated, contact our Privacy Officer. You may also file a complaint with the U.S. Department of Health and Human Services. You will not be penalized for filing a complaint.</p>

              <div className="contact-box">
                <p><strong>Range Medical Privacy Officer</strong></p>
                <p>1901 Westcliff Dr. Suite 10, Newport Beach, CA 92660</p>
                <p>Phone: (949) 997-3988 | Email: privacy@range-medical.com</p>
              </div>
            </div>

            <div className={`checkbox-row ${status.type === 'error' && !formData.acknowledged ? 'error' : ''}`}>
              <input type="checkbox" id="acknowledged" name="acknowledged" className="checkbox" checked={formData.acknowledged} onChange={handleChange} />
              <label htmlFor="acknowledged" className="checkbox-label">
                <strong>I acknowledge</strong> that I have received and reviewed a copy of the Range Medical Notice of Privacy Practices. I understand how my health information may be used and disclosed.
              </label>
            </div>

            <button type="submit" className="btn" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Acknowledgment'}
            </button>

            {status.message && (
              <div className={`status status-${status.type}`}>
                {status.message}
              </div>
            )}
          </div>
        </form>
      </div>
    </>
  );
}
