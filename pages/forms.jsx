import Layout from '../components/Layout';
import Link from 'next/link';

export default function Forms() {
  const forms = [
    {
      title: 'New Patient Medical Intake',
      description: 'Complete this form before your first visit. Includes personal information, medical history, medications, and allergies.',
      href: '/intake',
      icon: '📋',
      required: true,
      time: '10-15 min'
    },
    {
      title: 'Hormone Therapy Consent',
      description: 'Consent form for testosterone replacement therapy (TRT) or hormone replacement therapy (HRT).',
      href: '/consent/hrt',
      icon: '💉',
      required: true,
      time: '5 min',
      ready: true
    },
    {
      title: 'Peptide Therapy Consent',
      description: 'Consent form for peptide protocols including BPC-157, Thymosin Beta-4, and growth hormone peptides.',
      href: '/consent/peptide',
      icon: '🧬',
      required: true,
      time: '5 min',
      ready: true
    },
    {
      title: 'IV Therapy Consent',
      description: 'Consent form for IV vitamin infusions, NAD+ therapy, and injection treatments.',
      href: '/consent/iv',
      icon: '💧',
      required: true,
      time: '5 min'
    },
    {
      title: 'Hyperbaric Oxygen Therapy Consent',
      description: 'Consent form for hyperbaric oxygen therapy (HBOT) sessions.',
      href: '/consent/hbot',
      icon: '🫁',
      required: true,
      time: '5 min',
      ready: true
    },
    {
      title: 'Weight Loss Program Consent',
      description: 'Consent form for GLP-1 weight loss medications including Semaglutide and Tirzepatide.',
      href: '/consent/weight-loss',
      icon: '⚖️',
      required: true,
      time: '5 min'
    },
    {
      title: 'Blood Draw Consent',
      description: 'Consent for laboratory blood draw services.',
      href: '/consent/blood-draw',
      icon: '🩸',
      required: true,
      time: '2 min',
      ready: true
    },
    {
      title: 'HIPAA Privacy Notice',
      description: 'Acknowledgment of our privacy practices and how we protect your health information.',
      href: '/consent/hipaa',
      icon: '🔒',
      required: true,
      time: '3 min'
    },
    {
      title: 'Financial Agreement',
      description: 'Agreement regarding payment policies, cancellation fees, and financial responsibility.',
      href: '/consent/financial',
      icon: '💳',
      required: true,
      time: '3 min'
    }
  ];

  return (
    <Layout 
      title="Patient Forms & Consents | Range Medical"
      description="Complete your patient intake forms and treatment consents online before your visit to Range Medical in Newport Beach."
    >
      {/* Hero */}
      <section className="hero" style={{ paddingBottom: '3rem' }}>
        <div className="container">
          <span className="hero-badge">Patient Portal</span>
          <h1>Forms & Consents</h1>
          <p className="hero-sub">Complete your paperwork online before your visit. This helps us prepare for your appointment and saves you time at the clinic.</p>
        </div>
      </section>

      {/* Trust Bar */}
      <div className="trust-bar">
        <div className="trust-inner">
          <span className="trust-item">✓ Secure & Encrypted</span>
          <span className="trust-item">✓ HIPAA Compliant</span>
          <span className="trust-item">✓ Save Your Progress</span>
        </div>
      </div>

      {/* Forms List */}
      <section className="section">
        <div className="container">
          <div className="section-kicker">Required Forms</div>
          <h2 className="section-title">New Patient Forms</h2>
          <p className="section-subtitle">All new patients must complete the Medical Intake form. Additional consents are required based on your treatment plan.</p>
          
          <div className="forms-grid">
            {forms.map((form, index) => (
              <Link href={form.href} key={index} className="form-card">
                <div className="form-card-icon">{form.icon}</div>
                <div className="form-card-content">
                  <h3>{form.title}</h3>
                  <p>{form.description}</p>
                  <div className="form-card-meta">
                    <span className="form-time">⏱ {form.time}</span>
                    {form.required && <span className="form-required">Required</span>}
                  </div>
                </div>
                <div className="form-card-arrow">→</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Help Section */}
      <section className="section section-gray">
        <div className="container">
          <div className="help-box">
            <div className="help-content">
              <h2>Need Help?</h2>
              <p>If you have trouble completing any forms online, you can fill them out when you arrive at the clinic. Please arrive 15 minutes early if you haven't completed your paperwork.</p>
              <p style={{ marginTop: '1rem' }}>Questions? Call us at <a href="tel:+19499973988" style={{ color: '#000', fontWeight: 600 }}>(949) 997-3988</a></p>
            </div>
          </div>
        </div>
      </section>

      <style jsx>{`
        .forms-grid {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-top: 2rem;
        }
        
        .form-card {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          padding: 1.5rem;
          background: #ffffff;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          text-decoration: none;
          color: inherit;
          transition: all 0.2s;
        }
        
        .form-card:hover {
          border-color: #000000;
          box-shadow: 0 4px 20px rgba(0,0,0,0.06);
          transform: translateX(4px);
        }
        
        .form-card-icon {
          font-size: 2rem;
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #fafafa;
          border-radius: 12px;
          flex-shrink: 0;
        }
        
        .form-card-content {
          flex: 1;
        }
        
        .form-card-content h3 {
          font-size: 1.125rem;
          font-weight: 700;
          color: #171717;
          margin-bottom: 0.25rem;
        }
        
        .form-card-content p {
          font-size: 0.875rem;
          color: #525252;
          line-height: 1.5;
          margin-bottom: 0.75rem;
        }
        
        .form-card-meta {
          display: flex;
          gap: 1rem;
          align-items: center;
        }
        
        .form-time {
          font-size: 0.75rem;
          color: #737373;
        }
        
        .form-required {
          font-size: 0.6875rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #dc2626;
          background: #fee2e2;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
        }
        
        .form-card-arrow {
          font-size: 1.25rem;
          color: #a3a3a3;
          transition: all 0.2s;
        }
        
        .form-card:hover .form-card-arrow {
          color: #000000;
          transform: translateX(4px);
        }
        
        .help-box {
          background: #ffffff;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          padding: 2rem;
          text-align: center;
          max-width: 600px;
          margin: 0 auto;
        }
        
        .help-box h2 {
          font-size: 1.25rem;
          font-weight: 700;
          margin-bottom: 0.75rem;
        }
        
        .help-box p {
          font-size: 0.9375rem;
          color: #525252;
          line-height: 1.6;
        }
        
        @media (max-width: 640px) {
          .form-card {
            flex-direction: column;
            text-align: center;
          }
          
          .form-card-meta {
            justify-content: center;
          }
          
          .form-card-arrow {
            display: none;
          }
        }
      `}</style>
    </Layout>
  );
}
