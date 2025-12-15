// =====================================================
// RANGE MEDICAL - PATIENT DASHBOARD
// /pages/patient/dashboard.js
// Clean black/white design with full service view
// =====================================================

import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

export default function PatientDashboard() {
  const router = useRouter();
  const { token } = router.query;
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
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
          <span style={styles.patientName}>Hi, {patient.first_name || patient.full_name?.split(' ')[0]}</span>
        </div>
      </header>

      {/* Tabs */}
      <nav style={styles.tabs}>
        <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>Overview</TabButton>
        <TabButton active={activeTab === 'protocols'} onClick={() => setActiveTab('protocols')}>
          My Protocols {patient.protocols?.length > 0 && `(${patient.protocols.length})`}
        </TabButton>
        <TabButton active={activeTab === 'sessions'} onClick={() => setActiveTab('sessions')}>
          Sessions {patient.session_packs?.length > 0 && `(${patient.session_packs.length})`}
        </TabButton>
        <TabButton active={activeTab === 'log'} onClick={() => setActiveTab('log')}>Log Injection</TabButton>
      </nav>

      {/* Main Content */}
      <main style={styles.main}>
        {activeTab === 'overview' && <OverviewTab patient={patient} openLogModal={openLogModal} />}
        {activeTab === 'protocols' && <ProtocolsTab protocols={patient.protocols} openLogModal={openLogModal} />}
        {activeTab === 'sessions' && <SessionsTab packs={patient.session_packs} challenges={patient.challenges} />}
        {activeTab === 'log' && <LogTab patient={patient} onSuccess={() => fetchPatientData(token)} />}
      </main>

      {/* Contact Footer */}
      <footer style={styles.footer}>
        <div style={styles.contactBox}>
          <h3 style={styles.contactTitle}>Need to Schedule?</h3>
          <p style={styles.contactText}>Call or text us to book your next appointment</p>
          <a href="tel:+19494244679" style={styles.phoneLink}>(949) 424-4679</a>
        </div>
      </footer>

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
        body { margin: 0; padding: 0; }
      `}</style>
    </>
  );
}

// =====================================================
// COMPONENTS
// =====================================================
function RangeLogo() {
  return (
    <svg width="120" height="60" viewBox="0 0 1024 1024" fill="none">
      {/* Circle */}
      <circle cx="512" cy="380" r="280" stroke="black" strokeWidth="28" fill="none"/>
      {/* Triangle A - open top */}
      <path d="M512 180 L340 520 L400 520 L512 310 L624 520 L684 520 Z" fill="black"/>
      {/* Underline bar inside circle */}
      <rect x="370" y="540" width="284" height="28" fill="black"/>
      {/* RANGE text */}
      <text x="170" y="820" fontFamily="Inter, Arial, sans-serif" fontSize="200" fontWeight="600" letterSpacing="40" fill="black">
        RANGE
      </text>
      {/* TM */}
      <text x="920" y="700" fontFamily="Inter, Arial, sans-serif" fontSize="50" fill="black">™</text>
    </svg>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      ...styles.tabBtn,
      borderBottomColor: active ? '#000' : 'transparent',
      color: active ? '#000' : '#666'
    }}>
      {children}
    </button>
  );
}

// =====================================================
// OVERVIEW TAB
// =====================================================
function OverviewTab({ patient, openLogModal }) {
  return (
    <div>
      <h2 style={styles.pageTitle}>Your Dashboard</h2>
      
      <div style={styles.servicesGrid}>
        {/* HRT Membership */}
        {patient.hrt && (
          <ServiceCard
            title="HRT Membership"
            status={patient.hrt.status}
          >
            <div style={styles.serviceItem}>
              <span style={styles.serviceLabel}>Monthly Range IV</span>
              {patient.hrt.iv_used ? (
                <span style={styles.statusUsed}>✓ Used this month</span>
              ) : (
                <span style={styles.statusAvailable}>
                  Available · {patient.hrt.iv_days_left} days left
                </span>
              )}
            </div>
            
            {patient.hrt.next_lab_due && (
              <div style={styles.serviceItem}>
                <span style={styles.serviceLabel}>Next Labs Due</span>
                <span style={styles.serviceValue}>{formatDate(patient.hrt.next_lab_due)}</span>
              </div>
            )}

            {patient.hrt.injection_location === 'take_home' && (
              <button onClick={() => openLogModal('hrt')} style={styles.logButton}>
                Log Injection
              </button>
            )}
          </ServiceCard>
        )}

        {/* Weight Loss */}
        {patient.weight_loss && (
          <ServiceCard title="Weight Loss Program" status={patient.weight_loss.status}>
            <div style={styles.serviceItem}>
              <span style={styles.serviceLabel}>Medication</span>
              <span style={styles.serviceValue}>
                {patient.weight_loss.medication} · {patient.weight_loss.current_dose}
              </span>
            </div>
            
            {patient.weight_loss.current_weight && (
              <div style={styles.serviceItem}>
                <span style={styles.serviceLabel}>Current Weight</span>
                <span style={styles.serviceValue}>{patient.weight_loss.current_weight} lbs</span>
              </div>
            )}

            {patient.weight_loss.starting_weight && patient.weight_loss.current_weight && (
              <div style={styles.progressSection}>
                <div style={styles.weightProgress}>
                  <span>Lost: {(patient.weight_loss.starting_weight - patient.weight_loss.current_weight).toFixed(1)} lbs</span>
                </div>
              </div>
            )}

            <button onClick={() => openLogModal('weight_loss')} style={styles.logButton}>
              Log Injection / Weight
            </button>
          </ServiceCard>
        )}

        {/* Active Protocols */}
        {patient.protocols?.filter(p => p.status === 'active').slice(0, 2).map((protocol, i) => (
          <ServiceCard key={i} title={protocol.program_name} status={protocol.status} subtitle="Peptide Protocol">
            {/* Peptide Name */}
            {(protocol.primary_peptide || protocol.secondary_peptide) && (
              <div style={styles.serviceItem}>
                <span style={styles.serviceLabel}>Peptide</span>
                <span style={styles.serviceValue}>
                  {protocol.primary_peptide}
                  {protocol.secondary_peptide && ` + ${protocol.secondary_peptide}`}
                </span>
              </div>
            )}
            
            <div style={styles.serviceItem}>
              <span style={styles.serviceLabel}>Days Remaining</span>
              <span style={{...styles.serviceValue, fontSize: '20px', fontWeight: '700'}}>{protocol.days_remaining} days</span>
            </div>
            
            <div style={styles.serviceItem}>
              <span style={styles.serviceLabel}>Dose</span>
              <span style={styles.serviceValue}>{protocol.dose} · {protocol.frequency}</span>
            </div>

            {protocol.injection_location === 'take_home' && (
              <button onClick={() => openLogModal(`peptide_${protocol.id}`)} style={styles.logButton}>
                Log Injection
              </button>
            )}
          </ServiceCard>
        ))}

        {/* Session Packs Summary */}
        {patient.session_packs?.slice(0, 2).map((pack, i) => (
          <ServiceCard key={i} title={pack.package_name} status={pack.status}>
            <div style={styles.sessionsDisplay}>
              <div style={styles.sessionsNumber}>{pack.sessions_remaining}</div>
              <div style={styles.sessionsLabel}>sessions remaining</div>
            </div>
            <div style={styles.progressBar}>
              <div style={{
                ...styles.progressFill,
                width: `${(pack.sessions_remaining / pack.sessions_purchased) * 100}%`
              }} />
            </div>
            <div style={styles.progressText}>
              {pack.sessions_used} of {pack.sessions_purchased} used
            </div>
          </ServiceCard>
        ))}
      </div>

      {/* Show more link if there are more items */}
      {(patient.protocols?.filter(p => p.status === 'active').length > 2 || patient.session_packs?.length > 2) && (
        <p style={styles.moreText}>See all in tabs above</p>
      )}
    </div>
  );
}

// =====================================================
// PROTOCOLS TAB
// =====================================================
function ProtocolsTab({ protocols, openLogModal }) {
  const active = protocols?.filter(p => p.status === 'active') || [];
  const completed = protocols?.filter(p => p.status === 'completed') || [];

  if (!protocols || protocols.length === 0) {
    return <EmptyState message="No protocols found" />;
  }

  return (
    <div>
      <h2 style={styles.pageTitle}>My Protocols</h2>

      {active.length > 0 && (
        <section style={styles.section}>
          <h3 style={styles.sectionTitle}>Active ({active.length})</h3>
          <div style={styles.protocolGrid}>
            {active.map((protocol, i) => (
              <div key={i} style={styles.protocolCard}>
                <div style={styles.protocolHeader}>
                  <h4 style={styles.protocolName}>{protocol.program_name}</h4>
                  <span style={styles.activeBadge}>Active</span>
                </div>
                
                {/* Peptide Names */}
                {(protocol.primary_peptide || protocol.secondary_peptide) && (
                  <div style={styles.peptideRow}>
                    <span style={styles.peptideLabel}>Peptide:</span>
                    <span style={styles.peptideValue}>
                      {protocol.primary_peptide}
                      {protocol.secondary_peptide && ` + ${protocol.secondary_peptide}`}
                    </span>
                  </div>
                )}
                
                {/* Days Remaining - Prominent */}
                <div style={styles.daysRemainingBox}>
                  <div style={styles.daysNumber}>{protocol.days_remaining}</div>
                  <div style={styles.daysLabel}>days remaining</div>
                </div>
                
                <div style={styles.protocolDetails}>
                  <div style={styles.detailRow}>
                    <span>Dose:</span>
                    <span>{protocol.dose} · {protocol.frequency}</span>
                  </div>
                  <div style={styles.detailRow}>
                    <span>End Date:</span>
                    <span>{formatDate(protocol.end_date)}</span>
                  </div>
                  {protocol.injections_completed > 0 && (
                    <div style={styles.detailRow}>
                      <span>Injections Logged:</span>
                      <span>{protocol.injections_completed}</span>
                    </div>
                  )}
                </div>

                {protocol.special_instructions && (
                  <div style={styles.instructionsBox}>
                    <strong>Instructions:</strong> {protocol.special_instructions}
                  </div>
                )}

                {protocol.injection_location === 'take_home' && (
                  <button onClick={() => openLogModal(`peptide_${protocol.id}`)} style={styles.logButton}>
                    Log Injection
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {completed.length > 0 && (
        <section style={styles.section}>
          <h3 style={styles.sectionTitle}>Completed ({completed.length})</h3>
          <div style={styles.protocolGrid}>
            {completed.map((protocol, i) => (
              <div key={i} style={{...styles.protocolCard, opacity: 0.7}}>
                <div style={styles.protocolHeader}>
                  <h4 style={styles.protocolName}>{protocol.program_name}</h4>
                  <span style={styles.completedBadge}>Completed</span>
                </div>
                {(protocol.primary_peptide || protocol.secondary_peptide) && (
                  <div style={styles.peptideRow}>
                    <span style={styles.peptideLabel}>Peptide:</span>
                    <span style={styles.peptideValue}>
                      {protocol.primary_peptide}
                      {protocol.secondary_peptide && ` + ${protocol.secondary_peptide}`}
                    </span>
                  </div>
                )}
                <div style={styles.protocolDetails}>
                  <div style={styles.detailRow}>
                    <span>Duration:</span>
                    <span>{protocol.duration_days} days</span>
                  </div>
                  <div style={styles.detailRow}>
                    <span>Dates:</span>
                    <span>{formatDate(protocol.start_date)} - {formatDate(protocol.end_date)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// =====================================================
// SESSIONS TAB
// =====================================================
function SessionsTab({ packs, challenges }) {
  if ((!packs || packs.length === 0) && (!challenges || challenges.length === 0)) {
    return <EmptyState message="No active session packs" />;
  }

  return (
    <div>
      <h2 style={styles.pageTitle}>My Sessions</h2>

      {/* Session Packs */}
      {packs?.length > 0 && (
        <div style={styles.sessionsGrid}>
          {packs.map((pack, i) => (
            <div key={i} style={styles.sessionCard}>
              <h4 style={styles.sessionTitle}>{pack.package_name}</h4>
              <div style={styles.bigNumber}>{pack.sessions_remaining}</div>
              <div style={styles.sessionSubtext}>sessions remaining</div>
              <div style={styles.progressBar}>
                <div style={{
                  ...styles.progressFill,
                  width: `${(pack.sessions_remaining / pack.sessions_purchased) * 100}%`
                }} />
              </div>
              <div style={styles.sessionMeta}>
                {pack.sessions_used} of {pack.sessions_purchased} used
              </div>
              {pack.expiration_date && (
                <div style={styles.sessionExpiry}>
                  Expires: {formatDate(pack.expiration_date)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Challenges */}
      {challenges?.length > 0 && (
        <section style={styles.section}>
          <h3 style={styles.sectionTitle}>6-Week Challenge</h3>
          {challenges.map((challenge, i) => (
            <div key={i} style={styles.challengeCard}>
              <h4 style={styles.challengeTitle}>{challenge.challenge_name}</h4>
              <div style={styles.challengeGrid}>
                <div style={styles.challengeStat}>
                  <div style={styles.bigNumber}>{challenge.hbot_remaining}</div>
                  <div style={styles.sessionSubtext}>HBOT remaining</div>
                </div>
                <div style={styles.challengeStat}>
                  <div style={styles.bigNumber}>{challenge.rlt_remaining}</div>
                  <div style={styles.sessionSubtext}>RLT remaining</div>
                </div>
              </div>
              <div style={styles.sessionMeta}>
                {formatDate(challenge.start_date)} - {formatDate(challenge.end_date)}
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}

// =====================================================
// LOG TAB
// =====================================================
function LogTab({ patient, onSuccess }) {
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    injection_type: 'hrt',
    injection_date: new Date().toISOString().split('T')[0],
    injection_site: 'abdomen',
    weight: '',
    notes: ''
  });

  // Build injection type options based on patient's services
  const injectionOptions = [];
  if (patient.hrt) injectionOptions.push({ value: 'hrt', label: 'HRT - Testosterone' });
  if (patient.weight_loss) injectionOptions.push({ value: 'weight_loss', label: `Weight Loss - ${patient.weight_loss.medication}` });
  patient.protocols?.filter(p => p.status === 'active').forEach(p => {
    injectionOptions.push({ value: `peptide_${p.id}`, label: `Peptide - ${p.protocol_name}` });
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccess(false);

    try {
      const response = await fetch('/api/patient/log-injection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: patient.id,
          ...formData
        })
      });

      const result = await response.json();
      if (result.success) {
        setSuccess(true);
        setFormData({
          ...formData,
          injection_date: new Date().toISOString().split('T')[0],
          notes: '',
          weight: ''
        });
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

  if (injectionOptions.length === 0) {
    return <EmptyState message="No active protocols to log injections for" />;
  }

  return (
    <div>
      <h2 style={styles.pageTitle}>Log Injection</h2>

      {success && (
        <div style={styles.successMessage}>
          ✓ Injection logged successfully!
        </div>
      )}

      <form onSubmit={handleSubmit} style={styles.logForm}>
        <div style={styles.formGroup}>
          <label style={styles.label}>What are you logging?</label>
          <select
            value={formData.injection_type}
            onChange={e => setFormData({...formData, injection_type: e.target.value})}
            style={styles.select}
            required
          >
            {injectionOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

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
            style={styles.select}
          >
            <option value="abdomen">Abdomen</option>
            <option value="thigh">Thigh</option>
            <option value="glute">Glute</option>
            <option value="deltoid">Deltoid</option>
          </select>
        </div>

        {formData.injection_type === 'weight_loss' && (
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

        <button type="submit" style={styles.submitBtn} disabled={submitting}>
          {submitting ? 'Saving...' : 'Log Injection'}
        </button>
      </form>
    </div>
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
    weight: '',
    notes: ''
  });

  const isWeightLoss = type === 'weight_loss';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('/api/patient/log-injection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: patient.id,
          injection_type: type,
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
              style={styles.select}
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
              placeholder="Any notes..."
              value={formData.notes}
              onChange={e => setFormData({...formData, notes: e.target.value})}
              style={{...styles.input, minHeight: '60px', resize: 'vertical'}}
            />
          </div>

          <button type="submit" style={styles.submitBtn} disabled={submitting}>
            {submitting ? 'Saving...' : 'Log Injection'}
          </button>
        </form>
      </div>
    </div>
  );
}

// =====================================================
// EMPTY STATE
// =====================================================
function EmptyState({ message }) {
  return (
    <div style={styles.emptyState}>
      <p>{message}</p>
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
    padding: '16px 24px',
    borderBottom: '1px solid #e5e5e5'
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center'
  },
  patientName: {
    fontSize: '14px',
    fontWeight: '500'
  },

  // Tabs
  tabs: {
    borderBottom: '1px solid #e5e5e5',
    padding: '0 24px',
    display: 'flex',
    gap: '4px',
    overflowX: 'auto'
  },
  tabBtn: {
    background: 'none',
    border: 'none',
    borderBottom: '2px solid transparent',
    padding: '14px 16px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    whiteSpace: 'nowrap'
  },
  
  // Main
  main: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '24px'
  },
  pageTitle: {
    fontSize: '24px',
    fontWeight: '600',
    margin: '0 0 24px 0',
    color: '#000'
  },

  // Sections
  section: {
    marginBottom: '32px'
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#666',
    margin: '0 0 12px 0',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  
  // Services Grid
  servicesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '16px',
    marginBottom: '24px'
  },
  
  // Service Card
  serviceCard: {
    border: '1px solid #e5e5e5',
    borderRadius: '12px',
    overflow: 'hidden'
  },
  cardHeader: {
    padding: '16px',
    borderBottom: '1px solid #f0f0f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  cardTitle: {
    fontSize: '15px',
    fontWeight: '600',
    margin: 0,
    color: '#000'
  },
  cardSubtitle: {
    fontSize: '12px',
    color: '#666',
    margin: '2px 0 0 0'
  },
  statusBadge: {
    padding: '4px 10px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase'
  },
  cardBody: {
    padding: '16px'
  },
  
  // Service Items
  serviceItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px'
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
    marginBottom: '12px'
  },
  sessionsNumber: {
    fontSize: '40px',
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
    height: '6px',
    backgroundColor: '#f0f0f0',
    borderRadius: '3px',
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#000',
    borderRadius: '3px'
  },
  progressText: {
    fontSize: '12px',
    color: '#666',
    marginTop: '6px',
    textAlign: 'center'
  },
  progressSection: {
    marginBottom: '12px'
  },
  weightProgress: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#166534',
    textAlign: 'center'
  },
  
  // Log Button
  logButton: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#000',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    marginTop: '12px'
  },

  // Protocol Grid
  protocolGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '16px'
  },
  protocolCard: {
    border: '1px solid #e5e5e5',
    borderRadius: '12px',
    padding: '16px',
    backgroundColor: '#fff'
  },
  protocolHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '8px'
  },
  protocolName: {
    fontSize: '15px',
    fontWeight: '600',
    margin: 0
  },
  activeBadge: {
    padding: '4px 10px',
    backgroundColor: '#dcfce7',
    color: '#166534',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase'
  },
  completedBadge: {
    padding: '4px 10px',
    backgroundColor: '#f3f4f6',
    color: '#666',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase'
  },
  peptideRow: {
    marginBottom: '12px'
  },
  peptideLabel: {
    fontSize: '12px',
    color: '#666',
    marginRight: '6px'
  },
  peptideValue: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#000'
  },
  daysRemainingBox: {
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    padding: '12px',
    textAlign: 'center',
    marginBottom: '12px'
  },
  daysNumber: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#000'
  },
  daysLabel: {
    fontSize: '12px',
    color: '#666'
  },
  instructionsBox: {
    fontSize: '12px',
    color: '#666',
    backgroundColor: '#f9f9f9',
    padding: '10px',
    borderRadius: '6px',
    marginBottom: '12px'
  },
  protocolDetails: {
    marginBottom: '12px'
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    marginBottom: '6px',
    color: '#374151'
  },

  // Sessions Tab
  sessionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '16px'
  },
  sessionCard: {
    border: '1px solid #e5e5e5',
    borderRadius: '12px',
    padding: '20px',
    textAlign: 'center'
  },
  sessionTitle: {
    fontSize: '14px',
    fontWeight: '600',
    margin: '0 0 12px 0'
  },
  bigNumber: {
    fontSize: '48px',
    fontWeight: '700',
    lineHeight: 1
  },
  sessionSubtext: {
    fontSize: '12px',
    color: '#666',
    marginTop: '4px',
    marginBottom: '12px'
  },
  sessionMeta: {
    fontSize: '12px',
    color: '#666',
    marginTop: '8px'
  },
  sessionExpiry: {
    fontSize: '11px',
    color: '#ef4444',
    marginTop: '8px'
  },
  challengeCard: {
    border: '1px solid #e5e5e5',
    borderRadius: '12px',
    padding: '20px'
  },
  challengeTitle: {
    fontSize: '16px',
    fontWeight: '600',
    margin: '0 0 16px 0',
    textAlign: 'center'
  },
  challengeGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
    marginBottom: '12px'
  },
  challengeStat: {
    textAlign: 'center'
  },

  // Log Form
  logForm: {
    maxWidth: '400px'
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
  select: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #e5e5e5',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    backgroundColor: '#fff'
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
    cursor: 'pointer'
  },
  successMessage: {
    backgroundColor: '#dcfce7',
    color: '#166534',
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '14px',
    fontWeight: '500'
  },

  // Footer
  footer: {
    borderTop: '1px solid #e5e5e5',
    padding: '24px'
  },
  contactBox: {
    maxWidth: '800px',
    margin: '0 auto',
    backgroundColor: '#f9f9f9',
    borderRadius: '12px',
    padding: '24px',
    textAlign: 'center'
  },
  contactTitle: {
    fontSize: '16px',
    fontWeight: '600',
    margin: '0 0 6px 0'
  },
  contactText: {
    fontSize: '14px',
    color: '#666',
    margin: '0 0 12px 0'
  },
  phoneLink: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#000',
    textDecoration: 'none'
  },
  moreText: {
    fontSize: '13px',
    color: '#666',
    textAlign: 'center'
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
    padding: '16px 20px',
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

  // Empty State
  emptyState: {
    textAlign: 'center',
    padding: '48px',
    color: '#666'
  }
};
