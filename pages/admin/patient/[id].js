// /pages/admin/patient/[id].js
// Complete Patient Profile View
// Range Medical

import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

export default function PatientProfile() {
  const router = useRouter();
  const { id, ghl, email, phone } = router.query;
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [authChecked, setAuthChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Check auth on mount
  useEffect(() => {
    const storedAuth = localStorage.getItem('range_admin_auth');
    if (storedAuth) {
      setPassword(storedAuth);
      setIsAuthenticated(true);
    }
    setAuthChecked(true);
  }, []);

  // Fetch patient data
  useEffect(() => {
    if (isAuthenticated && password && (id || ghl || email || phone)) {
      fetchPatientProfile();
    }
  }, [isAuthenticated, password, id, ghl, email, phone]);

  const fetchPatientProfile = async () => {
    setLoading(true);
    setError('');
    
    try {
      let url = '/api/admin/patient?';
      if (id && id !== 'lookup') url += `id=${id}`;
      else if (ghl) url += `ghl_contact_id=${ghl}`;
      else if (email) url += `email=${encodeURIComponent(email)}`;
      else if (phone) url += `phone=${encodeURIComponent(phone)}`;
      
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${password}` }
      });
      
      if (!res.ok) {
        const err = await res.json();
        setError(err.error || 'Failed to load patient');
        setLoading(false);
        return;
      }
      
      const result = await res.json();
      setData(result);
      setLoading(false);
    } catch (err) {
      setError('Failed to load patient profile');
      setLoading(false);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    localStorage.setItem('range_admin_auth', password);
    setIsAuthenticated(true);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatPhone = (phone) => {
    if (!phone) return '-';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0,3)}) ${cleaned.slice(3,6)}-${cleaned.slice(6)}`;
    }
    if (cleaned.length === 11) {
      return `+${cleaned[0]} (${cleaned.slice(1,4)}) ${cleaned.slice(4,7)}-${cleaned.slice(7)}`;
    }
    return phone;
  };

  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
    },
    header: {
      backgroundColor: '#000',
      padding: '16px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    },
    logo: {
      color: '#fff',
      fontSize: '13px',
      fontWeight: '600',
      letterSpacing: '2px',
      margin: 0
    },
    backLink: {
      color: '#fff',
      textDecoration: 'none',
      fontSize: '14px',
      display: 'flex',
      alignItems: 'center',
      gap: '6px'
    },
    main: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '24px'
    },
    patientHeader: {
      backgroundColor: '#fff',
      borderRadius: '12px',
      padding: '24px',
      marginBottom: '24px',
      border: '1px solid #e5e5e5'
    },
    patientName: {
      fontSize: '28px',
      fontWeight: '700',
      color: '#000',
      margin: '0 0 8px',
      letterSpacing: '-0.5px'
    },
    patientMeta: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '24px',
      marginBottom: '20px',
      fontSize: '14px',
      color: '#666'
    },
    metaItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px'
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
      gap: '16px',
      marginTop: '20px',
      paddingTop: '20px',
      borderTop: '1px solid #eee'
    },
    statBox: {
      textAlign: 'center',
      padding: '12px'
    },
    statNumber: {
      fontSize: '24px',
      fontWeight: '700',
      color: '#000'
    },
    statLabel: {
      fontSize: '12px',
      color: '#666',
      marginTop: '4px'
    },
    tabs: {
      display: 'flex',
      gap: '4px',
      marginBottom: '24px',
      backgroundColor: '#fff',
      borderRadius: '12px',
      padding: '6px',
      border: '1px solid #e5e5e5',
      overflowX: 'auto'
    },
    tab: {
      padding: '10px 20px',
      borderRadius: '8px',
      border: 'none',
      backgroundColor: 'transparent',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      color: '#666',
      whiteSpace: 'nowrap',
      transition: 'all 0.15s ease'
    },
    tabActive: {
      backgroundColor: '#000',
      color: '#fff'
    },
    tabBadge: {
      marginLeft: '6px',
      padding: '2px 8px',
      borderRadius: '10px',
      fontSize: '11px',
      fontWeight: '600'
    },
    section: {
      backgroundColor: '#fff',
      borderRadius: '12px',
      border: '1px solid #e5e5e5',
      overflow: 'hidden'
    },
    sectionHeader: {
      padding: '16px 20px',
      borderBottom: '1px solid #eee',
      fontSize: '16px',
      fontWeight: '600',
      color: '#000'
    },
    sectionBody: {
      padding: '20px'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: '14px'
    },
    th: {
      textAlign: 'left',
      padding: '12px 16px',
      borderBottom: '1px solid #eee',
      fontWeight: '600',
      color: '#666',
      fontSize: '12px',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    },
    td: {
      padding: '12px 16px',
      borderBottom: '1px solid #f5f5f5',
      color: '#333'
    },
    statusBadge: {
      display: 'inline-block',
      padding: '4px 10px',
      borderRadius: '20px',
      fontSize: '11px',
      fontWeight: '600',
      textTransform: 'uppercase'
    },
    emptyState: {
      textAlign: 'center',
      padding: '40px 20px',
      color: '#666'
    },
    infoGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '20px'
    },
    infoCard: {
      padding: '16px',
      backgroundColor: '#f9f9f9',
      borderRadius: '8px'
    },
    infoLabel: {
      fontSize: '12px',
      fontWeight: '600',
      color: '#888',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      marginBottom: '6px'
    },
    infoValue: {
      fontSize: '15px',
      color: '#000'
    },
    conditionsList: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '8px',
      marginTop: '12px'
    },
    conditionTag: {
      padding: '6px 12px',
      backgroundColor: '#fee2e2',
      color: '#991b1b',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '500'
    },
    conditionTagGreen: {
      backgroundColor: '#dcfce7',
      color: '#166534'
    },
    labsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '12px'
    },
    labValue: {
      padding: '12px',
      backgroundColor: '#f9f9f9',
      borderRadius: '8px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    labName: {
      fontSize: '13px',
      color: '#666'
    },
    labNumber: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#000'
    },
    loginBox: {
      maxWidth: '400px',
      margin: '100px auto',
      padding: '40px',
      backgroundColor: '#fff',
      borderRadius: '12px',
      border: '1px solid #e5e5e5'
    },
    input: {
      width: '100%',
      padding: '12px 16px',
      fontSize: '16px',
      border: '1px solid #ddd',
      borderRadius: '8px',
      marginBottom: '16px',
      boxSizing: 'border-box'
    },
    button: {
      width: '100%',
      padding: '12px 24px',
      fontSize: '16px',
      fontWeight: '600',
      backgroundColor: '#000',
      color: '#fff',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer'
    },
    linkButton: {
      padding: '6px 12px',
      fontSize: '12px',
      backgroundColor: '#f5f5f5',
      color: '#333',
      border: '1px solid #ddd',
      borderRadius: '6px',
      cursor: 'pointer',
      textDecoration: 'none'
    },
    loading: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '400px',
      fontSize: '16px',
      color: '#666'
    }
  };

  // Login screen
  if (!authChecked) {
    return <div style={styles.container}><div style={styles.loading}>Loading...</div></div>;
  }

  if (!isAuthenticated) {
    return (
      <div style={styles.container}>
        <Head>
          <title>Login | Range Medical</title>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        </Head>
        <div style={styles.loginBox}>
          <h2 style={{ margin: '0 0 24px', textAlign: 'center' }}>Patient Profile</h2>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
            />
            <button type="submit" style={styles.button}>Login</button>
          </form>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={styles.container}>
        <Head>
          <title>Loading... | Range Medical</title>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        </Head>
        <header style={styles.header}>
          <h1 style={styles.logo}>RANGE MEDICAL</h1>
        </header>
        <div style={styles.loading}>Loading patient profile...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <Head>
          <title>Error | Range Medical</title>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        </Head>
        <header style={styles.header}>
          <h1 style={styles.logo}>RANGE MEDICAL</h1>
          <a href="/admin/protocols" style={styles.backLink}>← Back to Protocols</a>
        </header>
        <div style={styles.loading}>{error}</div>
      </div>
    );
  }

  const { patient, stats, intakes, consents, labs, documents, protocols, purchases } = data;
  const intake = intakes[0]; // Most recent intake
  const latestLab = labs[0]; // Most recent lab

  // Medical conditions from intake
  const conditions = intake ? [
    intake.high_blood_pressure && `High Blood Pressure${intake.high_blood_pressure_year ? ` (${intake.high_blood_pressure_year})` : ''}`,
    intake.high_cholesterol && `High Cholesterol${intake.high_cholesterol_year ? ` (${intake.high_cholesterol_year})` : ''}`,
    intake.heart_disease && `Heart Disease${intake.heart_disease_type ? ` - ${intake.heart_disease_type}` : ''}`,
    intake.diabetes && `Diabetes${intake.diabetes_type ? ` - ${intake.diabetes_type}` : ''}`,
    intake.thyroid_disorder && `Thyroid Disorder${intake.thyroid_disorder_type ? ` - ${intake.thyroid_disorder_type}` : ''}`,
    intake.depression_anxiety && 'Depression/Anxiety',
    intake.kidney_disease && `Kidney Disease${intake.kidney_disease_type ? ` - ${intake.kidney_disease_type}` : ''}`,
    intake.liver_disease && `Liver Disease${intake.liver_disease_type ? ` - ${intake.liver_disease_type}` : ''}`,
    intake.autoimmune_disorder && `Autoimmune${intake.autoimmune_disorder_type ? ` - ${intake.autoimmune_disorder_type}` : ''}`,
    intake.cancer && `Cancer History${intake.cancer_type ? ` - ${intake.cancer_type}` : ''}`
  ].filter(Boolean) : [];

  return (
    <div style={styles.container}>
      <Head>
        <title>{patient.name || 'Patient'} | Range Medical</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <header style={styles.header}>
        <h1 style={styles.logo}>RANGE MEDICAL</h1>
        <a href="/admin/protocols" style={styles.backLink}>← Back to Protocols</a>
      </header>

      <main style={styles.main}>
        {/* Patient Header */}
        <div style={styles.patientHeader}>
          <h1 style={styles.patientName}>{patient.name || 'Unknown Patient'}</h1>
          
          <div style={styles.patientMeta}>
            {patient.email && (
              <div style={styles.metaItem}>
                <span>📧</span>
                <span>{patient.email}</span>
              </div>
            )}
            {patient.phone && (
              <div style={styles.metaItem}>
                <span>📱</span>
                <span>{formatPhone(patient.phone)}</span>
              </div>
            )}
            {patient.date_of_birth && (
              <div style={styles.metaItem}>
                <span>🎂</span>
                <span>{formatDate(patient.date_of_birth)}</span>
              </div>
            )}
            {patient.ghl_contact_id && (
              <a
                href={`https://app.gohighlevel.com/v2/location/WICdvbXmTjQORW6GiHWW/contacts/detail/${patient.ghl_contact_id}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ ...styles.metaItem, color: '#3b82f6', textDecoration: 'none' }}
              >
                <span>🔗</span>
                <span>View in GHL</span>
              </a>
            )}
          </div>

          <div style={styles.statsGrid}>
            <div style={styles.statBox}>
              <div style={styles.statNumber}>{formatCurrency(stats.totalSpent)}</div>
              <div style={styles.statLabel}>Total Spent</div>
            </div>
            <div style={styles.statBox}>
              <div style={styles.statNumber}>{stats.activeProtocols}</div>
              <div style={styles.statLabel}>Active Programs</div>
            </div>
            <div style={styles.statBox}>
              <div style={styles.statNumber}>{stats.completedProtocols}</div>
              <div style={styles.statLabel}>Completed</div>
            </div>
            <div style={styles.statBox}>
              <div style={styles.statNumber}>{stats.totalInjections}</div>
              <div style={styles.statLabel}>Injections Logged</div>
            </div>
            <div style={styles.statBox}>
              <div style={styles.statNumber}>{stats.labsCount}</div>
              <div style={styles.statLabel}>Lab Panels</div>
            </div>
            <div style={styles.statBox}>
              <div style={{ ...styles.statNumber, color: stats.hasIntake ? '#16a34a' : '#dc2626' }}>
                {stats.hasIntake ? '✓' : '✗'}
              </div>
              <div style={styles.statLabel}>Intake Form</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={styles.tabs}>
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'intake', label: 'Medical History', count: intakes.length },
            { id: 'labs', label: 'Labs', count: labs.length },
            { id: 'consents', label: 'Consents', count: consents.length },
            { id: 'protocols', label: 'Protocols', count: protocols.length },
            { id: 'purchases', label: 'Purchases', count: purchases.length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                ...styles.tab,
                ...(activeTab === tab.id ? styles.tabActive : {})
              }}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span style={{
                  ...styles.tabBadge,
                  backgroundColor: activeTab === tab.id ? 'rgba(255,255,255,0.2)' : '#f0f0f0',
                  color: activeTab === tab.id ? '#fff' : '#666'
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gap: '24px' }}>
            {/* Quick Info */}
            <div style={styles.section}>
              <div style={styles.sectionHeader}>Patient Information</div>
              <div style={styles.sectionBody}>
                <div style={styles.infoGrid}>
                  <div style={styles.infoCard}>
                    <div style={styles.infoLabel}>First Visit</div>
                    <div style={styles.infoValue}>{formatDate(stats.firstVisit)}</div>
                  </div>
                  <div style={styles.infoCard}>
                    <div style={styles.infoLabel}>Last Visit</div>
                    <div style={styles.infoValue}>{formatDate(stats.lastVisit)}</div>
                  </div>
                  <div style={styles.infoCard}>
                    <div style={styles.infoLabel}>Total Purchases</div>
                    <div style={styles.infoValue}>{stats.totalPurchases}</div>
                  </div>
                  <div style={styles.infoCard}>
                    <div style={styles.infoLabel}>Signed Consents</div>
                    <div style={styles.infoValue}>{stats.consentsCount}</div>
                  </div>
                </div>

                {conditions.length > 0 && (
                  <>
                    <h4 style={{ margin: '24px 0 12px', fontSize: '14px', fontWeight: '600' }}>Medical Conditions</h4>
                    <div style={styles.conditionsList}>
                      {conditions.map((condition, i) => (
                        <span key={i} style={styles.conditionTag}>{condition}</span>
                      ))}
                    </div>
                  </>
                )}

                {intake?.has_allergies && intake?.allergies && (
                  <>
                    <h4 style={{ margin: '24px 0 12px', fontSize: '14px', fontWeight: '600' }}>Allergies</h4>
                    <div style={styles.conditionsList}>
                      <span style={styles.conditionTag}>{intake.allergies}</span>
                    </div>
                  </>
                )}

                {intake?.on_medications && intake?.current_medications && (
                  <>
                    <h4 style={{ margin: '24px 0 12px', fontSize: '14px', fontWeight: '600' }}>Current Medications</h4>
                    <p style={{ color: '#333', margin: 0 }}>{intake.current_medications}</p>
                  </>
                )}
              </div>
            </div>

            {/* Active Protocols */}
            {protocols.filter(p => p.status === 'active').length > 0 && (
              <div style={styles.section}>
                <div style={styles.sectionHeader}>Active Protocols</div>
                <div style={styles.sectionBody}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Program</th>
                        <th style={styles.th}>Peptide/Treatment</th>
                        <th style={styles.th}>Progress</th>
                        <th style={styles.th}>Started</th>
                      </tr>
                    </thead>
                    <tbody>
                      {protocols.filter(p => p.status === 'active').map(p => (
                        <tr key={p.id}>
                          <td style={styles.td}>{p.program_name || p.program_type}</td>
                          <td style={styles.td}>{p.primary_peptide || '-'}</td>
                          <td style={styles.td}>
                            {p.injections_completed} / {p.duration_days} days
                          </td>
                          <td style={styles.td}>{formatDate(p.start_date)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Recent Purchases */}
            {purchases.length > 0 && (
              <div style={styles.section}>
                <div style={styles.sectionHeader}>Recent Purchases</div>
                <div style={styles.sectionBody}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Date</th>
                        <th style={styles.th}>Category</th>
                        <th style={styles.th}>Item</th>
                        <th style={styles.th}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {purchases.slice(0, 5).map(p => (
                        <tr key={p.id}>
                          <td style={styles.td}>{formatDate(p.purchase_date)}</td>
                          <td style={styles.td}>
                            <span style={{
                              ...styles.statusBadge,
                              backgroundColor: 
                                p.category === 'Peptide' ? '#dbeafe' :
                                p.category === 'IV Therapy' ? '#cffafe' :
                                p.category === 'Weight Loss' ? '#fef3c7' :
                                p.category === 'HRT' ? '#ede9fe' :
                                '#f3f4f6',
                              color:
                                p.category === 'Peptide' ? '#1e40af' :
                                p.category === 'IV Therapy' ? '#0e7490' :
                                p.category === 'Weight Loss' ? '#92400e' :
                                p.category === 'HRT' ? '#5b21b6' :
                                '#374151'
                            }}>
                              {p.category}
                            </span>
                          </td>
                          <td style={styles.td}>{p.item_name}</td>
                          <td style={styles.td}>{formatCurrency(p.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'intake' && (
          <div style={styles.section}>
            <div style={styles.sectionHeader}>Medical History & Intake</div>
            <div style={styles.sectionBody}>
              {!intake ? (
                <div style={styles.emptyState}>No intake form on file</div>
              ) : (
                <div style={styles.infoGrid}>
                  <div style={styles.infoCard}>
                    <div style={styles.infoLabel}>What Brings You In</div>
                    <div style={styles.infoValue}>{intake.what_brings_you_in || intake.what_brings_you || '-'}</div>
                  </div>
                  
                  {intake.currently_injured && (
                    <div style={styles.infoCard}>
                      <div style={styles.infoLabel}>Current Injury</div>
                      <div style={styles.infoValue}>
                        {intake.injury_description || intake.injury_location || 'Yes'}
                        {intake.injury_when_occurred && ` (${intake.injury_when_occurred})`}
                      </div>
                    </div>
                  )}

                  {intake.on_hrt && (
                    <div style={styles.infoCard}>
                      <div style={styles.infoLabel}>Current HRT</div>
                      <div style={styles.infoValue}>{intake.hrt_details || 'Yes'}</div>
                    </div>
                  )}

                  {intake.current_medications && (
                    <div style={{ ...styles.infoCard, gridColumn: 'span 2' }}>
                      <div style={styles.infoLabel}>Current Medications</div>
                      <div style={styles.infoValue}>{intake.current_medications}</div>
                    </div>
                  )}

                  {intake.allergies && (
                    <div style={styles.infoCard}>
                      <div style={styles.infoLabel}>Allergies</div>
                      <div style={styles.infoValue}>{intake.allergies}</div>
                    </div>
                  )}

                  <div style={styles.infoCard}>
                    <div style={styles.infoLabel}>Submitted</div>
                    <div style={styles.infoValue}>{formatDate(intake.submitted_at)}</div>
                  </div>

                  {intake.pdf_url && (
                    <div style={styles.infoCard}>
                      <div style={styles.infoLabel}>Documents</div>
                      <div style={styles.infoValue}>
                        <a href={intake.pdf_url} target="_blank" rel="noopener noreferrer" style={styles.linkButton}>
                          📄 View Full Intake PDF
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {conditions.length > 0 && (
                <>
                  <h4 style={{ margin: '32px 0 16px', fontSize: '16px', fontWeight: '600', borderTop: '1px solid #eee', paddingTop: '24px' }}>
                    Medical Conditions
                  </h4>
                  <div style={styles.conditionsList}>
                    {conditions.map((condition, i) => (
                      <span key={i} style={styles.conditionTag}>{condition}</span>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === 'labs' && (
          <div style={styles.section}>
            <div style={styles.sectionHeader}>Lab Results</div>
            <div style={styles.sectionBody}>
              {labs.length === 0 ? (
                <div style={styles.emptyState}>No lab results on file</div>
              ) : (
                <>
                  {labs.map(lab => (
                    <div key={lab.id} style={{ marginBottom: '32px', paddingBottom: '24px', borderBottom: '1px solid #eee' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
                            {lab.panel_type || 'Lab Panel'}
                          </h4>
                          <p style={{ margin: '4px 0 0', color: '#666', fontSize: '14px' }}>
                            {formatDate(lab.test_date)} • {lab.lab_provider || 'Unknown Lab'}
                          </p>
                        </div>
                        {(lab.pdf_url || lab.lab_url) && (
                          <a 
                            href={lab.pdf_url || lab.lab_url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            style={styles.linkButton}
                          >
                            📄 View PDF
                          </a>
                        )}
                      </div>

                      <div style={styles.labsGrid}>
                        {lab.total_testosterone && (
                          <div style={styles.labValue}>
                            <span style={styles.labName}>Total Testosterone</span>
                            <span style={styles.labNumber}>{lab.total_testosterone}</span>
                          </div>
                        )}
                        {lab.free_testosterone && (
                          <div style={styles.labValue}>
                            <span style={styles.labName}>Free Testosterone</span>
                            <span style={styles.labNumber}>{lab.free_testosterone}</span>
                          </div>
                        )}
                        {lab.estradiol && (
                          <div style={styles.labValue}>
                            <span style={styles.labName}>Estradiol</span>
                            <span style={styles.labNumber}>{lab.estradiol}</span>
                          </div>
                        )}
                        {lab.hemoglobin_a1c && (
                          <div style={styles.labValue}>
                            <span style={styles.labName}>HbA1c</span>
                            <span style={styles.labNumber}>{lab.hemoglobin_a1c}%</span>
                          </div>
                        )}
                        {lab.vitamin_d && (
                          <div style={styles.labValue}>
                            <span style={styles.labName}>Vitamin D</span>
                            <span style={styles.labNumber}>{lab.vitamin_d}</span>
                          </div>
                        )}
                        {lab.tsh && (
                          <div style={styles.labValue}>
                            <span style={styles.labName}>TSH</span>
                            <span style={styles.labNumber}>{lab.tsh}</span>
                          </div>
                        )}
                        {lab.total_cholesterol && (
                          <div style={styles.labValue}>
                            <span style={styles.labName}>Total Cholesterol</span>
                            <span style={styles.labNumber}>{lab.total_cholesterol}</span>
                          </div>
                        )}
                        {lab.crp_hs && (
                          <div style={styles.labValue}>
                            <span style={styles.labName}>hs-CRP</span>
                            <span style={styles.labNumber}>{lab.crp_hs}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === 'consents' && (
          <div style={styles.section}>
            <div style={styles.sectionHeader}>Signed Consents</div>
            <div style={styles.sectionBody}>
              {consents.length === 0 ? (
                <div style={styles.emptyState}>No consent forms on file</div>
              ) : (
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Document</th>
                      <th style={styles.th}>Type</th>
                      <th style={styles.th}>Signed</th>
                      <th style={styles.th}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {consents.map(c => (
                      <tr key={c.id}>
                        <td style={styles.td}>{c.document_name || 'Consent Form'}</td>
                        <td style={styles.td}>{c.document_type || '-'}</td>
                        <td style={styles.td}>{formatDate(c.uploaded_at)}</td>
                        <td style={styles.td}>
                          {c.document_url && (
                            <a href={c.document_url} target="_blank" rel="noopener noreferrer" style={styles.linkButton}>
                              View
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {activeTab === 'protocols' && (
          <div style={styles.section}>
            <div style={styles.sectionHeader}>Treatment Protocols</div>
            <div style={styles.sectionBody}>
              {protocols.length === 0 ? (
                <div style={styles.emptyState}>No protocols on file</div>
              ) : (
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Status</th>
                      <th style={styles.th}>Program</th>
                      <th style={styles.th}>Treatment</th>
                      <th style={styles.th}>Progress</th>
                      <th style={styles.th}>Started</th>
                      <th style={styles.th}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {protocols.map(p => (
                      <tr key={p.id}>
                        <td style={styles.td}>
                          <span style={{
                            ...styles.statusBadge,
                            backgroundColor: p.status === 'active' ? '#dcfce7' : '#f3f4f6',
                            color: p.status === 'active' ? '#166534' : '#6b7280'
                          }}>
                            {p.status}
                          </span>
                        </td>
                        <td style={styles.td}>{p.program_name || p.program_type}</td>
                        <td style={styles.td}>{p.primary_peptide || '-'}</td>
                        <td style={styles.td}>{p.injections_completed} / {p.duration_days}</td>
                        <td style={styles.td}>{formatDate(p.start_date)}</td>
                        <td style={styles.td}>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            {(p.tracker_token || p.access_token) && (
                              <a href={`/track/${p.tracker_token || p.access_token}`} target="_blank" rel="noopener noreferrer" style={styles.linkButton}>
                                View
                              </a>
                            )}
                            <a 
                              href={`/admin/protocols?contact=${patient.ghl_contact_id}`} 
                              style={{...styles.linkButton, backgroundColor: '#1a365d', color: '#fff', border: 'none'}}
                            >
                              Edit
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {activeTab === 'purchases' && (
          <div style={styles.section}>
            <div style={styles.sectionHeader}>Purchase History</div>
            <div style={styles.sectionBody}>
              {purchases.length === 0 ? (
                <div style={styles.emptyState}>No purchase history</div>
              ) : (
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Date</th>
                      <th style={styles.th}>Category</th>
                      <th style={styles.th}>Item</th>
                      <th style={styles.th}>Qty</th>
                      <th style={styles.th}>Amount</th>
                      <th style={styles.th}>Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchases.map(p => (
                      <tr key={p.id}>
                        <td style={styles.td}>{formatDate(p.purchase_date)}</td>
                        <td style={styles.td}>
                          <span style={{
                            ...styles.statusBadge,
                            backgroundColor: 
                              p.category === 'Peptide' ? '#dbeafe' :
                              p.category === 'IV Therapy' ? '#cffafe' :
                              p.category === 'Weight Loss' ? '#fef3c7' :
                              p.category === 'HRT' ? '#ede9fe' :
                              p.category === 'Labs' ? '#dcfce7' :
                              '#f3f4f6',
                            color:
                              p.category === 'Peptide' ? '#1e40af' :
                              p.category === 'IV Therapy' ? '#0e7490' :
                              p.category === 'Weight Loss' ? '#92400e' :
                              p.category === 'HRT' ? '#5b21b6' :
                              p.category === 'Labs' ? '#166534' :
                              '#374151'
                          }}>
                            {p.category}
                          </span>
                        </td>
                        <td style={styles.td}>{p.item_name}</td>
                        <td style={styles.td}>{p.quantity}</td>
                        <td style={styles.td}>{formatCurrency(p.amount)}</td>
                        <td style={styles.td}>{p.source}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
