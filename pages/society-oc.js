import Head from 'next/head';
import { useState } from 'react';

export default function SocietyOC() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    services: [],
    goals: '',
    referral: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const services = [
    { value: 'Hormone Optimization', label: 'Hormone Optimization' },
    { value: 'Medical Weight Loss', label: 'Medical Weight Loss' },
    { value: 'IV Therapy', label: 'IV Therapy' },
    { value: 'Hyperbaric Oxygen', label: 'Hyperbaric Oxygen' },
    { value: 'Red Light Therapy', label: 'Red Light Therapy' },
    { value: 'PRP Injections', label: 'PRP Injections' },
    { value: 'Exosome Therapy', label: 'Exosome Therapy' },
    { value: 'Range Assessment', label: 'Range Assessment (Labs)' },
    { value: 'Not Sure', label: 'Not sure yet — help me decide' }
  ];

  const serviceCards = [
    { icon: '💉', title: 'Hormone Optimization', desc: 'Balanced hormones for energy, mood, performance, and how you feel every day.' },
    { icon: '📉', title: 'Medical Weight Loss', desc: 'Medical support for weight management, appetite control, and metabolism optimization.' },
    { icon: '💧', title: 'IV Therapy', desc: 'Vitamins, minerals, and nutrients delivered directly to your bloodstream.' },
    { icon: '🫁', title: 'Hyperbaric Oxygen', desc: 'Increased oxygen delivery to support healing, recovery, and cellular energy.' },
    { icon: '🔴', title: 'Red Light Therapy', desc: 'Light wavelengths that help cells recover, reduce inflammation, and function better.' },
    { icon: '🩸', title: 'PRP Injections', desc: 'Your own platelets concentrated and used to accelerate healing and regeneration.' },
    { icon: '🧬', title: 'Exosome Therapy', desc: 'Advanced regenerative therapy using cellular signaling for tissue repair.' }
  ];

  const formatPhone = (value) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 6) {
      return '(' + cleaned.substring(0, 3) + ') ' + cleaned.substring(3, 6) + '-' + cleaned.substring(6, 10);
    } else if (cleaned.length >= 3) {
      return '(' + cleaned.substring(0, 3) + ') ' + cleaned.substring(3);
    }
    return cleaned;
  };

  const handleServiceToggle = (service) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.services.length === 0) {
      setError('Please select at least one service you\'re interested in.');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/partnership-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          partner: 'Society OC',
          discount: '10%'
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit');
      }

      setSubmitted(true);

      // Facebook Pixel tracking
      if (typeof window !== 'undefined' && window.fbq) {
        window.fbq('track', 'Lead', {
          content_name: 'Society OC Partnership Form',
          content_category: formData.services.join(', ')
        });
      }
    } catch (err) {
      setError('There was an error submitting your request. Please try again or call us at (949) 997-3988.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Society OC x Range Medical | Exclusive Member Benefits</title>
        <meta name="description" content="Society OC members receive 10% off all Range Medical services. Hormone optimization, weight loss, IV therapy, and more in Newport Beach." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={styles.page}>
        {/* Header */}
        <header style={styles.header}>
          <img 
            src="https://storage.googleapis.com/msgsndr/WICdvbXmTjQORW6GiHWW/media/695fe7ca6eabe6386b2d84e1.png" 
            alt="Range Medical" 
            style={styles.logo}
          />
        </header>

        {/* Hero Section */}
        <section style={styles.hero}>
          <div style={styles.partnershipBadge}>
            <strong>Society OC</strong>
            <span style={{ color: '#999' }}>×</span>
            <strong>Range Medical</strong>
          </div>

          <h1 style={styles.heroTitle}>Exclusive Benefits for Society OC Members</h1>

          <p style={styles.heroSubtitle}>
            Society OC members receive exclusive pricing at Range Medical, a wellness and optimization clinic in Newport Beach.
          </p>

          <div style={styles.discountBanner}>
            <span style={{ color: '#4ade80' }}>10% OFF</span> All Services
          </div>

          <div style={styles.heroButtons}>
            <a href="#signup" style={styles.primaryBtn}>Get Started</a>
            <a href="tel:+19499973988" style={styles.secondaryBtn}>
              <span style={{ marginRight: 8 }}>📞</span> Call Now
            </a>
          </div>
        </section>

        {/* Services Section */}
        <section style={styles.servicesSection}>
          <h2 style={styles.sectionTitle}>Services Available to You</h2>
          <p style={styles.sectionSubtitle}>Select the services you're interested in when you fill out the form below</p>

          <div style={styles.servicesGrid}>
            {serviceCards.map((service, idx) => (
              <div key={idx} style={styles.serviceCard}>
                <div style={styles.serviceIcon}>{service.icon}</div>
                <h3 style={styles.serviceTitle}>{service.title}</h3>
                <p style={styles.serviceDesc}>{service.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Form Section */}
        <section style={styles.formSection} id="signup">
          <h2 style={styles.sectionTitle}>Get Started</h2>
          <p style={styles.sectionSubtitle}>Tell us about yourself and what you're interested in. We'll reach out to schedule your consultation.</p>

          <div style={styles.formContainer}>
            {!submitted ? (
              <form onSubmit={handleSubmit}>
                <div style={styles.formRow}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>First Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="John"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Last Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Smith"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      style={styles.input}
                    />
                  </div>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Phone *</label>
                  <input
                    type="tel"
                    required
                    placeholder="(949) 555-1234"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>What services are you interested in? *</label>
                  <div style={styles.checkboxGrid}>
                    {services.map((service) => (
                      <label
                        key={service.value}
                        style={{
                          ...styles.checkboxItem,
                          ...(formData.services.includes(service.value) ? styles.checkboxItemChecked : {})
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={formData.services.includes(service.value)}
                          onChange={() => handleServiceToggle(service.value)}
                          style={styles.checkbox}
                        />
                        <span>{service.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>What are your health goals? (Optional)</label>
                  <textarea
                    placeholder="Tell us what you're hoping to improve — energy, recovery, weight, performance, etc."
                    value={formData.goals}
                    onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
                    style={styles.textarea}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>How did you hear about this partnership?</label>
                  <select
                    value={formData.referral}
                    onChange={(e) => setFormData({ ...formData, referral: e.target.value })}
                    style={styles.select}
                  >
                    <option value="">Select one...</option>
                    <option value="Society OC Email">Society OC Email</option>
                    <option value="Society OC Event">Society OC Event</option>
                    <option value="Society OC Member">Fellow Society OC Member</option>
                    <option value="Instagram">Instagram</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {error && <p style={styles.error}>{error}</p>}

                <button type="submit" disabled={submitting} style={styles.submitBtn}>
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>

                <p style={styles.formNote}>
                  We'll reach out within 24 hours to schedule your consultation.<br />
                  Your 10% discount will be applied to all services.
                </p>
              </form>
            ) : (
              <div style={styles.successMessage}>
                <div style={styles.successIcon}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" style={{ width: 32, height: 32 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
                <h3 style={styles.successTitle}>You're All Set!</h3>
                <p style={styles.successText}>
                  We've received your information and will reach out within 24 hours to schedule your consultation. 
                  Your 10% Society OC member discount will be applied automatically.
                </p>
                <a href="tel:+19499973988" style={styles.callNowBtn}>
                  <span style={{ marginRight: 8 }}>📞</span> Call Now: (949) 997-3988
                </a>
              </div>
            )}
          </div>
        </section>

        {/* Location Section */}
        <section style={styles.locationSection}>
          <h3 style={styles.locationTitle}>Range Medical</h3>
          <p style={styles.locationText}>1901 Westcliff Dr, Newport Beach, CA 92660</p>
          <p style={styles.locationText}>Upstairs from Range Sports Therapy</p>
          <p style={{ ...styles.locationText, marginTop: 12 }}>
            <a href="tel:+19499973988" style={styles.locationLink}>(949) 997-3988</a>
          </p>
        </section>

        {/* Footer */}
        <footer style={styles.footer}>
          <img 
            src="https://storage.googleapis.com/msgsndr/WICdvbXmTjQORW6GiHWW/media/695fe7ca6eabe6386b2d84e1.png" 
            alt="Range Medical" 
            style={styles.footerLogo}
          />
          <p style={styles.footerText}>© 2025 Range Medical. All rights reserved.</p>
          <div style={styles.footerLinks}>
            <a href="https://www.range-medical.com/terms-of-use" style={styles.footerLink}>Terms</a>
            <a href="https://www.range-medical.com/privacy-policy" style={styles.footerLink}>Privacy</a>
            <a href="https://www.range-medical.com/" style={styles.footerLink}>Main Website</a>
          </div>
        </footer>
      </div>
    </>
  );
}

const styles = {
  page: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    background: '#ffffff',
    color: '#111111',
    lineHeight: 1.6,
    minHeight: '100vh'
  },
  header: {
    padding: '20px 24px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottom: '1px solid #f0f0f0',
    background: '#fff',
    position: 'sticky',
    top: 0,
    zIndex: 100
  },
  logo: {
    height: 40
  },
  hero: {
    padding: '80px 24px 60px',
    textAlign: 'center',
    maxWidth: 800,
    margin: '0 auto'
  },
  partnershipBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 12,
    background: '#f8f8f8',
    padding: '12px 24px',
    borderRadius: 100,
    marginBottom: 32,
    fontSize: 14,
    fontWeight: 500,
    color: '#333'
  },
  heroTitle: {
    fontSize: 'clamp(32px, 5vw, 48px)',
    fontWeight: 700,
    lineHeight: 1.2,
    marginBottom: 20,
    letterSpacing: '-0.02em'
  },
  heroSubtitle: {
    fontSize: 18,
    color: '#555',
    marginBottom: 32,
    maxWidth: 600,
    marginLeft: 'auto',
    marginRight: 'auto'
  },
  discountBanner: {
    background: '#111',
    color: '#fff',
    padding: '16px 32px',
    borderRadius: 12,
    display: 'inline-block',
    fontSize: 20,
    fontWeight: 600,
    letterSpacing: '0.02em'
  },
  heroButtons: {
    display: 'flex',
    gap: 16,
    justifyContent: 'center',
    marginTop: 32,
    flexWrap: 'wrap'
  },
  primaryBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '16px 32px',
    background: '#111',
    color: '#fff',
    borderRadius: 10,
    fontSize: 16,
    fontWeight: 600,
    textDecoration: 'none',
    transition: 'all 0.2s'
  },
  secondaryBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '16px 32px',
    background: '#fff',
    color: '#111',
    border: '2px solid #111',
    borderRadius: 10,
    fontSize: 16,
    fontWeight: 600,
    textDecoration: 'none',
    transition: 'all 0.2s'
  },
  servicesSection: {
    padding: '60px 24px',
    background: '#fafafa'
  },
  sectionTitle: {
    textAlign: 'center',
    fontSize: 28,
    fontWeight: 700,
    marginBottom: 12
  },
  sectionSubtitle: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 48,
    fontSize: 16
  },
  servicesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: 20,
    maxWidth: 1000,
    margin: '0 auto'
  },
  serviceCard: {
    background: '#fff',
    padding: 28,
    borderRadius: 16,
    border: '1px solid #eee'
  },
  serviceIcon: {
    fontSize: 28,
    marginBottom: 16
  },
  serviceTitle: {
    fontSize: 18,
    fontWeight: 600,
    marginBottom: 8
  },
  serviceDesc: {
    fontSize: 14,
    color: '#666',
    lineHeight: 1.5
  },
  formSection: {
    padding: '80px 24px',
    maxWidth: 600,
    margin: '0 auto'
  },
  formContainer: {
    background: '#fff',
    padding: 40,
    borderRadius: 20,
    border: '1px solid #eee',
    boxShadow: '0 4px 24px rgba(0,0,0,0.04)'
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 16
  },
  formGroup: {
    marginBottom: 24
  },
  label: {
    display: 'block',
    fontSize: 14,
    fontWeight: 500,
    marginBottom: 8,
    color: '#333'
  },
  input: {
    width: '100%',
    padding: '14px 16px',
    fontSize: 16,
    border: '1px solid #e0e0e0',
    borderRadius: 10,
    fontFamily: 'inherit',
    boxSizing: 'border-box'
  },
  textarea: {
    width: '100%',
    padding: '14px 16px',
    fontSize: 16,
    border: '1px solid #e0e0e0',
    borderRadius: 10,
    fontFamily: 'inherit',
    minHeight: 100,
    resize: 'vertical',
    boxSizing: 'border-box'
  },
  select: {
    width: '100%',
    padding: '14px 16px',
    fontSize: 16,
    border: '1px solid #e0e0e0',
    borderRadius: 10,
    fontFamily: 'inherit',
    background: '#fff',
    boxSizing: 'border-box'
  },
  checkboxGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 12
  },
  checkboxItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    cursor: 'pointer',
    padding: '12px 16px',
    border: '1px solid #e0e0e0',
    borderRadius: 10,
    transition: 'all 0.2s'
  },
  checkboxItemChecked: {
    borderColor: '#111',
    background: '#f8f8f8'
  },
  checkbox: {
    width: 18,
    height: 18,
    accentColor: '#111',
    cursor: 'pointer'
  },
  submitBtn: {
    width: '100%',
    padding: '16px 32px',
    background: '#111',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit'
  },
  formNote: {
    textAlign: 'center',
    fontSize: 13,
    color: '#888',
    marginTop: 20
  },
  error: {
    color: '#dc2626',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center'
  },
  successMessage: {
    textAlign: 'center',
    padding: 40
  },
  successIcon: {
    width: 64,
    height: 64,
    background: '#111',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 24px',
    color: '#fff'
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 700,
    marginBottom: 12
  },
  successText: {
    color: '#666',
    fontSize: 16
  },
  callNowBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px 32px',
    background: '#111',
    color: '#fff',
    borderRadius: 10,
    fontSize: 16,
    fontWeight: 600,
    textDecoration: 'none',
    marginTop: 24
  },
  locationSection: {
    padding: '60px 24px',
    background: '#111',
    color: '#fff',
    textAlign: 'center'
  },
  locationTitle: {
    fontSize: 20,
    fontWeight: 600,
    marginBottom: 8
  },
  locationText: {
    color: '#aaa',
    fontSize: 15,
    marginBottom: 4
  },
  locationLink: {
    color: '#fff',
    textDecoration: 'none'
  },
  footer: {
    padding: '40px 24px',
    textAlign: 'center',
    borderTop: '1px solid #eee'
  },
  footerLogo: {
    height: 32,
    marginBottom: 16,
    opacity: 0.8
  },
  footerText: {
    fontSize: 13,
    color: '#888'
  },
  footerLinks: {
    marginTop: 16,
    display: 'flex',
    justifyContent: 'center',
    gap: 24
  },
  footerLink: {
    fontSize: 13,
    color: '#666',
    textDecoration: 'none'
  }
};
