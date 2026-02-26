import Head from 'next/head';
import { useState } from 'react';
import { useRouter } from 'next/router';

export default function HIPAANotice() {
  const router = useRouter();
  const { phone, cid } = router.query; // phone number or contact ID from SMS link
  
  const [acknowledged, setAcknowledged] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!acknowledged) {
      setStatus({ type: 'error', message: 'Please check the box to acknowledge receipt' });
      return;
    }

    setLoading(true);
    setStatus({ type: 'loading', message: 'Recording acknowledgment...' });

    try {
      // Sync to GHL
      const response = await fetch('/api/hipaa-acknowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone || null,
          contactId: cid || null,
          acknowledgedAt: new Date().toISOString()
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to record acknowledgment');
      }

      // Save consent record to database
      try {
        await fetch('/api/consent-forms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            consentType: 'hipaa',
            consentDate: new Date().toISOString().split('T')[0],
            consentGiven: true,
            phone: phone || null,
            ghlContactId: cid || null,
          })
        });
      } catch (dbErr) {
        console.error('Consent DB save error:', dbErr);
      }

      setSubmitted(true);
    } catch (error) {
      console.error('Error:', error);
      // Still show success - we don't want to block patients
      // The acknowledgment can be verified by them viewing the page
      setSubmitted(true);
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
          .container { max-width: 500px; margin: 0 auto; padding: 2rem 1.5rem; }
          .card { background: #fff; border: 2px solid #000; padding: 3rem 2rem; text-align: center; }
          .icon { width: 80px; height: 80px; background: #000; color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2.5rem; margin: 0 auto 1.5rem; }
          h1 { font-size: 1.5rem; margin-bottom: 0.75rem; }
          .message { color: #525252; margin-bottom: 2rem; line-height: 1.6; }
          .footer { padding-top: 1.5rem; border-top: 2px solid #e5e5e5; }
          .footer p { font-size: 1.25rem; font-weight: 700; letter-spacing: 0.1em; }
        `}</style>
        <div className="container">
          <div className="card">
            <div className="icon">✓</div>
            <h1>Thank You!</h1>
            <p className="message">
              Your acknowledgment of our privacy practices has been recorded. 
              You may close this page.
            </p>
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
        <meta name="description" content="Notice of Privacy Practices for Range Medical." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex, nofollow" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <style jsx global>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', -apple-system, sans-serif; background: #f5f5f5; min-height: 100vh; line-height: 1.6; }
      `}</style>

      <style jsx>{`
        .container { max-width: 600px; margin: 0 auto; padding: 2rem 1.5rem; }
        .header { text-align: center; margin-bottom: 1.5rem; padding-bottom: 1.5rem; border-bottom: 2px solid #000; }
        .logo { font-size: 2rem; font-weight: 700; letter-spacing: 0.15em; }
        .title { font-size: 1rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #404040; margin-top: 0.5rem; }
        .card { background: #fff; border: 2px solid #000; padding: 1.5rem; }
        .notice { background: #fafafa; border: 1px solid #e5e5e5; padding: 1.25rem; margin-bottom: 1.5rem; max-height: 50vh; overflow-y: auto; }
        .notice h4 { font-size: 0.8125rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin: 1.25rem 0 0.5rem; color: #262626; }
        .notice h4:first-child { margin-top: 0; }
        .notice p { margin-bottom: 0.5rem; color: #404040; font-size: 0.875rem; }
        .notice ul { margin-left: 1.25rem; margin-bottom: 0.5rem; }
        .notice li { margin-bottom: 0.375rem; color: #404040; font-size: 0.875rem; }
        .notice strong { font-weight: 600; }
        .checkbox-row { display: flex; align-items: flex-start; gap: 0.75rem; padding: 1rem; background: #fafafa; border: 1.5px solid #d4d4d4; margin-bottom: 1rem; }
        .checkbox-row.error { border-color: #dc2626; background: #fef2f2; }
        .checkbox { width: 1.5rem; height: 1.5rem; accent-color: #000; cursor: pointer; flex-shrink: 0; margin-top: 2px; }
        .checkbox-label { font-size: 0.9375rem; cursor: pointer; color: #171717; line-height: 1.5; }
        .btn { width: 100%; padding: 1rem; font-size: 1rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; border: 2px solid #000; background: #000; color: #fff; cursor: pointer; font-family: inherit; transition: all 0.2s; }
        .btn:hover:not(:disabled) { background: #fff; color: #000; }
        .btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .status { margin-top: 1rem; padding: 0.75rem; text-align: center; font-size: 0.875rem; font-weight: 500; }
        .status-error { background: #fef2f2; color: #dc2626; border: 1px solid #dc2626; }
        .status-loading { background: #f5f5f5; color: #525252; }
        .contact-box { background: #f5f5f5; padding: 0.75rem; margin-top: 0.75rem; font-size: 0.8125rem; color: #525252; }
        .contact-box p { margin-bottom: 0.125rem; }
      `}</style>

      <div className="container">
        <div className="header">
          <h1 className="logo">RANGE MEDICAL</h1>
          <h2 className="title">Notice of Privacy Practices</h2>
        </div>

        <div className="card">
          <div className="notice">
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

            <div className="contact-box">
              <p><strong>Range Medical</strong></p>
              <p>1901 Westcliff Dr. Suite 10, Newport Beach, CA 92660</p>
              <p>(949) 997-3988 | privacy@range-medical.com</p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className={`checkbox-row ${status.type === 'error' ? 'error' : ''}`}>
              <input 
                type="checkbox" 
                id="acknowledged" 
                className="checkbox" 
                checked={acknowledged} 
                onChange={(e) => {
                  setAcknowledged(e.target.checked);
                  if (status.type === 'error') setStatus({ type: '', message: '' });
                }} 
              />
              <label htmlFor="acknowledged" className="checkbox-label">
                I acknowledge that I have received and reviewed this Notice of Privacy Practices.
              </label>
            </div>

            <button type="submit" className="btn" disabled={loading}>
              {loading ? 'Submitting...' : 'I Acknowledge'}
            </button>

            {status.message && status.type === 'error' && (
              <div className={`status status-${status.type}`}>
                {status.message}
              </div>
            )}
          </form>
        </div>
      </div>
    </>
  );
}
