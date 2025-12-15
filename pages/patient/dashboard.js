// =====================================================
// RANGE MEDICAL - PATIENT DASHBOARD
// /pages/patient/dashboard.js
// Clean black/white design with injection logging
// =====================================================

import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

export default function PatientDashboard() {
  const router = useRouter();
  const { token } = router.query;
  
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState(null);
  const [showLogModal, setShowLogModal] = useState(false);
  const [logType, setLogType] = useState(null);

  useEffect(() => {
    if (token) {
      fetchPatientData(token);
    }
  }, [token]);

  const fetchPatientData = async (token) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/patient/dashboard?token=${token}`);
      const result = await response.json();
      
      if (result.success) {
        setPatient(result.data);
      } else {
        // Invalid token - redirect to login
        router.push('/patient/login');
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const openLogModal = (type) => {
    setLogType(type);
    setShowLogModal(true);
  };

  if (loading) {
    return (
      <PageWrapper>
        <div style={styles.loading}>
          <div style={styles.spinner}></div>
          <p>Loading your dashboard...</p>
        </div>
      </PageWrapper>
    );
  }

  if (!patient) {
    return (
      <PageWrapper>
        <div style={styles.loading}>
          <p>Unable to load your information. Please try logging in again.</p>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      {/* Header */}
      <header style={styles.header}>
        <RangeLogo />
        <div style={styles.headerRight}>
          <span style={styles.patientName}>Hi, {patient.first_name}</span>
        </div>
      </header>

      {/* Main Content */}
      <main style={styles.main}>
        <h1 style={styles.pageTitle}>Your Dashboard</h1>
        
        {/* Services Grid */}
        <div style={styles.servicesGrid}>
          
          {/* HRT Membership */}
          {patient.hrt && (
            <ServiceCard
              title="HRT Membership"
              status={patient.hrt.status}
            >
              {/* Monthly IV */}
              <div style={styles.serviceItem}>
                <span style={styles.serviceLabel}>Monthly Range IV</span>
                {patient.hrt.iv_used ? (
                  <span style={styles.statusUsed}>✓ Used</span>
                ) : (
                  <span style={styles.statusAvailable}>
                    Available · {patient.hrt.iv_days_left} days left
                  </span>
                )}
              </div>
              
              {/* Next Lab */}
              {patient.hrt.next_lab_due && (
                <div style={styles.serviceItem}>
                  <span style={styles.serviceLabel}>Next Labs Due</span>
                  <span style={styles.serviceValue}>
                    {formatDate(patient.hrt.next_lab_due)}
                  </span>
                </div>
              )}

              {/* Log Injection Button */}
              {patient.hrt.injection_location === 'take_home' && (
                <button 
                  onClick={() => openLogModal('hrt')}
                  style={styles.logButton}
                >
                  Log Injection
                </button>
              )}
            </ServiceCard>
          )}

          {/* Weight Loss */}
          {patient.weight_loss && (
            <ServiceCard
              title="Weight Loss Program"
              status={patient.weight_loss.status}
            >
              <div style={styles.serviceItem}>
                <span style={styles.serviceLabel}>Medication</span>
                <span style={styles.serviceValue}>
                  {patient.weight_loss.medication} · {patient.weight_loss.current_dose}
                </span>
              </div>
              
              {patient.weight_loss.current_weight && (
                <div style={styles.serviceItem}>
                  <span style={styles.serviceLabel}>Current Weight</span>
                  <span style={styles.serviceValue}>
                    {patient.weight_loss.current_weight} lbs
                  </span>
                </div>
              )}

              <button 
                onClick={() => openLogModal('weight_loss')}
                style={styles.logButton}
              >
                Log Injection / Weight
              </button>
            </ServiceCard>
          )}

          {/* Peptide Protocols */}
          {patient.protocols?.length > 0 && patient.protocols.map((protocol, i) => (
            <ServiceCard
              key={i}
              title={protocol.protocol_name}
              status={protocol.status}
              subtitle="Peptide Protocol"
            >
              <div style={styles.serviceItem}>
                <span style={styles.serviceLabel}>Days Remaining</span>
                <span style={styles.serviceValue}>{protocol.days_remaining} days</span>
              </div>
              
              <div style={styles.serviceItem}>
                <span style={styles.serviceLabel}>Dose</span>
                <span style={styles.serviceValue}>{protocol.dose}</span>
              </div>

              {protocol.injection_location === 'take_home' && (
                <button 
                  onClick={() => openLogModal(`peptide_${protocol.id}`)}
                  style={styles.logButton}
                >
                  Log Injection
                </button>
              )}
            </ServiceCard>
          ))}

          {/* Session Packs */}
          {patient.session_packs?.length > 0 && patient.session_packs.map((pack, i) => (
            <ServiceCard
              key={i}
              title={pack.package_name}
              status={pack.status}
            >
              <div style={styles.sessionsDisplay}>
                <div style={styles.sessionsNumber}>{pack.sessions_remaining}</div>
                <div style={styles.sessionsLabel}>sessions remaining</div>
              </div>
              
              <div style={styles.progressBar}>
                <div 
                  style={{
                    ...styles.progressFill,
                    width: `${(pack.sessions_remaining / pack.sessions_purchased) * 100}%`
                  }}
                />
              </div>
              <div style={styles.progressText}>
                {pack.sessions_used} of {pack.sessions_purchased} used
              </div>
            </ServiceCard>
          ))}
        </div>

        {/* Contact Info */}
        <div style={styles.contactBox}>
          <h3 style={styles.contactTitle}>Need to Schedule?</h3>
          <p style={styles.contactText}>
            Call or text us to book your next appointment
          </p>
          <a href="tel:+19494244679" style={styles.phoneLink}>
            (949) 424-4679
          </a>
        </div>
      </main>

      {/* Log Modal */}
      {showLogModal && (
        <LogInjectionModal
          type={logType}
          patient={patient}
          onClose={() => setShowLogModal(false)}
          onSuccess={() => {
            setShowLogModal(false);
            fetchPatientData(token);
          }}
        />
      )}
    </PageWrapper>
  );
}

// =====================================================
// PAGE WRAPPER
// =====================================================
function PageWrapper({ children }) {
  return (
    <>
      <Head>
        <title>My Dashboard | Range Medical</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>
      <div style={styles.page}>
        {children}
      </div>
      <style jsx global>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        body {
          margin: 0;
          padding: 0;
        }
      `}</style>
    </>
  );
}

// =====================================================
// RANGE LOGO
// =====================================================
function RangeLogo() {
  return (
    <svg width="100" height="50" viewBox="0 0 120 60" fill="none">
      <circle cx="30" cy="24" r="18" stroke="black" strokeWidth="2" fill="none"/>
      <path d="M30 12 L22 32 M30 12 L38 32 M24 26 L36 26" stroke="black" strokeWidth="2" fill="none"/>
      <text x="0" y="52" fontFamily="Inter, sans-serif" fontSize="16" fontWeight="600" fill="black">
        RANGE
      </text>
    </svg>
  );
}

// =====================================================
// SERVICE CARD
// =====================================================
function ServiceCard({ title, subtitle, status, children }) {
  return (
    <div style={styles.serviceCard}>
      <div style={styles.cardHeader}>
        <div>
          <h3 style={styles.cardTitle}>{title}</h3>
          {subtitle && <p style={styles.cardSubtitle}>{subtitle}</p>}
        </div>
        <span style={{
          ...styles.statusBadge,
          backgroundColor: status === 'active' ? '#000' : '#e5e5e5',
          color: status === 'active' ? '#fff' : '#666'
        }}>
          {status === 'active' ? 'Active' : status}
        </span>
      </div>
      <div style={styles.cardBody}>
        {children}
      </div>
    </div>
  );
}

// =====================================================
// LOG INJECTION MODAL
// =====================================================
function LogInjectionModal({ type, patient, onClose, onSuccess }) {
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    injection_date: new Date().toISOString().split('T')[0],
    injection_site: 'abdomen',
    dose: '',
    weight: '',
    notes: ''
  });

  const isWeightLoss = type === 'weight_loss';
  const isPeptide = type?.startsWith('peptide_');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('/api/patient/log-injection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: patient.id,
          injection_type: type.replace('peptide_', ''),
          ...formData
        })
      });

      const result = await response.json();
      if (result.success) {
        onSuccess();
      } else {
        alert('Error logging injection');
      }
    } catch (err) {
      alert('Error logging injection');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>Log Injection</h2>
          <button onClick={onClose} style={styles.closeBtn}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Date</label>
            <input
              type="date"
              value={formData.injection_date}
              onChange={e => setFormData({...formData, injection_date: e.target.value})}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Injection Site</label>
            <select
              value={formData.injection_site}
              onChange={e => setFormData({...formData, injection_site: e.target.value})}
              style={styles.input}
            >
              <option value="abdomen">Abdomen</option>
              <option value="thigh">Thigh</option>
              <option value="glute">Glute</option>
              <option value="deltoid">Deltoid</option>
            </select>
          </div>

          {isWeightLoss && (
            <div style={styles.formGroup}>
              <label style={styles.label}>Current Weight (optional)</label>
              <input
                type="number"
                step="0.1"
                placeholder="e.g., 185.5"
                value={formData.weight}
                onChange={e => setFormData({...formData, weight: e.target.value})}
                style={styles.input}
              />
            </div>
          )}

          <div style={styles.formGroup}>
            <label style={styles.label}>Notes (optional)</label>
            <textarea
              placeholder="Any notes about this injection..."
              value={formData.notes}
              onChange={e => setFormData({...formData, notes: e.target.value})}
              style={{...styles.input, minHeight: '80px', resize: 'vertical'}}
            />
          </div>

          <button 
            type="submit" 
            style={styles.submitBtn}
            disabled={submitting}
          >
            {submitting ? 'Saving...' : 'Log Injection'}
          </button>
        </form>
      </div>
    </div>
  );
}

// =====================================================
// UTILITIES
// =====================================================
function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

// =====================================================
// STYLES
// =====================================================
const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#fff',
    fontFamily: 'Inter, -apple-system, sans-serif'
  },
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    color: '#666'
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid #e5e5e5',
    borderTopColor: '#000',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '16px'
  },
  
  // Header
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 32px',
    borderBottom: '1px solid #e5e5e5'
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  patientName: {
    fontSize: '14px',
    fontWeight: '500'
  },
  
  // Main
  main: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '32px'
  },
  pageTitle: {
    fontSize: '28px',
    fontWeight: '600',
    margin: '0 0 32px 0',
    color: '#000'
  },
  
  // Services Grid
  servicesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '20px',
    marginBottom: '40px'
  },
  
  // Service Card
  serviceCard: {
    border: '1px solid #e5e5e5',
    borderRadius: '12px',
    overflow: 'hidden'
  },
  cardHeader: {
    padding: '20px',
    borderBottom: '1px solid #f0f0f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: '600',
    margin: 0,
    color: '#000'
  },
  cardSubtitle: {
    fontSize: '12px',
    color: '#666',
    margin: '4px 0 0 0'
  },
  statusBadge: {
    padding: '4px 10px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase'
  },
  cardBody: {
    padding: '20px'
  },
  
  // Service Items
  serviceItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px'
  },
  serviceLabel: {
    fontSize: '13px',
    color: '#666'
  },
  serviceValue: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#000'
  },
  statusUsed: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#666'
  },
  statusAvailable: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#000'
  },
  
  // Sessions Display
  sessionsDisplay: {
    textAlign: 'center',
    marginBottom: '16px'
  },
  sessionsNumber: {
    fontSize: '48px',
    fontWeight: '700',
    color: '#000',
    lineHeight: 1
  },
  sessionsLabel: {
    fontSize: '12px',
    color: '#666',
    marginTop: '4px'
  },
  progressBar: {
    height: '8px',
    backgroundColor: '#f0f0f0',
    borderRadius: '4px',
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#000',
    borderRadius: '4px',
    transition: 'width 0.3s'
  },
  progressText: {
    fontSize: '12px',
    color: '#666',
    marginTop: '8px',
    textAlign: 'center'
  },
  
  // Log Button
  logButton: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#000',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    marginTop: '16px'
  },
  
  // Contact Box
  contactBox: {
    backgroundColor: '#f9f9f9',
    borderRadius: '12px',
    padding: '32px',
    textAlign: 'center'
  },
  contactTitle: {
    fontSize: '18px',
    fontWeight: '600',
    margin: '0 0 8px 0',
    color: '#000'
  },
  contactText: {
    fontSize: '14px',
    color: '#666',
    margin: '0 0 16px 0'
  },
  phoneLink: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#000',
    textDecoration: 'none'
  },
  
  // Modal
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    width: '100%',
    maxWidth: '400px',
    margin: '20px'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    borderBottom: '1px solid #e5e5e5'
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: '600',
    margin: 0
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#666'
  },
  form: {
    padding: '20px'
  },
  formGroup: {
    marginBottom: '16px'
  },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '500',
    marginBottom: '6px',
    color: '#000'
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #e5e5e5',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box'
  },
  submitBtn: {
    width: '100%',
    padding: '14px',
    backgroundColor: '#000',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '8px'
  }
};
