// =====================================================
// RANGE MEDICAL - STAFF PATIENT PROFILE
// /pages/admin/patient/[id].js
// Complete patient view with all services and history
// =====================================================

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function PatientProfile() {
  const router = useRouter();
  const { id } = router.query; // ghl_contact_id
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [patient, setPatient] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id) {
      fetchPatientProfile(id);
    }
  }, [id]);

  const fetchPatientProfile = async (contactId) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/patient/${contactId}`);
      const result = await response.json();
      
      if (result.success) {
        setPatient(result.data);
      } else {
        setError(result.error || 'Patient not found');
      }
    } catch (err) {
      setError('Failed to load patient');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <PageWrapper>
        <div style={styles.loading}>
          <div style={styles.spinner}></div>
          <p>Loading patient...</p>
        </div>
      </PageWrapper>
    );
  }

  if (error || !patient) {
    return (
      <PageWrapper>
        <div style={styles.errorState}>
          <h2>Patient Not Found</h2>
          <p>{error || 'Unable to load patient information'}</p>
          <button onClick={() => router.push('/admin/dashboard')} style={styles.backBtn}>
            ← Back to Dashboard
          </button>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <button onClick={() => router.push('/admin/dashboard')} style={styles.backLink}>
            ← Back to Dashboard
          </button>
          <h1 style={styles.patientName}>{patient.full_name || patient.name}</h1>
          <div style={styles.patientMeta}>
            {patient.email && <span>{patient.email}</span>}
            {patient.phone && <span> · {patient.phone}</span>}
          </div>
        </div>
        <div style={styles.headerRight}>
          <button 
            onClick={() => window.open(`https://app.gohighlevel.com/v2/location/WICdvbXmTjQORW6GiHWW/contacts/detail/${patient.ghl_contact_id}`, '_blank')}
            style={styles.ghlBtn}
          >
            Open in GHL
          </button>
        </div>
      </header>

      {/* Tabs */}
      <nav style={styles.tabs}>
        <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>Overview</TabButton>
        <TabButton active={activeTab === 'purchases'} onClick={() => setActiveTab('purchases')}>
          Purchases {patient.purchases?.length > 0 && `(${patient.purchases.length})`}
        </TabButton>
        <TabButton active={activeTab === 'protocols'} onClick={() => setActiveTab('protocols')}>
          Protocols {patient.protocols?.length > 0 && `(${patient.protocols.length})`}
        </TabButton>
        <TabButton active={activeTab === 'injections'} onClick={() => setActiveTab('injections')}>
          Injections {patient.injection_log?.length > 0 && `(${patient.injection_log.length})`}
        </TabButton>
        <TabButton active={activeTab === 'intake'} onClick={() => setActiveTab('intake')}>
          Medical Intake {patient.intakes?.length > 0 && `(${patient.intakes.length})`}
        </TabButton>
        <TabButton active={activeTab === 'consents'} onClick={() => setActiveTab('consents')}>
          Consents {patient.consents?.length > 0 && `(${patient.consents.length})`}
        </TabButton>
      </nav>

      {/* Content */}
      <main style={styles.main}>
        {activeTab === 'overview' && <OverviewTab patient={patient} />}
        {activeTab === 'purchases' && <PurchasesTab purchases={patient.purchases} />}
        {activeTab === 'protocols' && <ProtocolsTab protocols={patient.protocols} />}
        {activeTab === 'injections' && <InjectionsTab patient={patient} onRefresh={() => fetchPatientProfile(id)} />}
        {activeTab === 'intake' && <IntakeTab intakes={patient.intakes} />}
        {activeTab === 'consents' && <ConsentsTab consents={patient.consents} />}
      </main>
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
        <title>Patient Profile | Range Medical</title>
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
// TAB BUTTON
// =====================================================
function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        ...styles.tabBtn,
        borderBottomColor: active ? '#000' : 'transparent',
        color: active ? '#000' : '#666'
      }}
    >
      {children}
    </button>
  );
}

// =====================================================
// OVERVIEW TAB
// =====================================================
function OverviewTab({ patient }) {
  return (
    <div style={styles.overviewGrid}>
      {/* Active Services */}
      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>Active Services</h3>
        <div style={styles.servicesGrid}>
          {/* HRT Membership */}
          {patient.hrt && (
            <div style={styles.serviceCard}>
              <div style={styles.serviceHeader}>
                <span style={styles.serviceName}>HRT Membership</span>
                <span style={{
                  ...styles.statusBadge,
                  backgroundColor: patient.hrt.status === 'active' ? '#dcfce7' : '#f3f4f6',
                  color: patient.hrt.status === 'active' ? '#166534' : '#666'
                }}>
                  {patient.hrt.status}
                </span>
              </div>
              <div style={styles.serviceDetails}>
                <div style={styles.detailRow}>
                  <span>Type:</span>
                  <span>{patient.hrt.membership_type}</span>
                </div>
                <div style={styles.detailRow}>
                  <span>Monthly IV:</span>
                  <span>{patient.hrt.iv_used ? '✓ Used' : `Available (${patient.hrt.iv_days_left}d left)`}</span>
                </div>
                {patient.hrt.next_lab_due && (
                  <div style={styles.detailRow}>
                    <span>Next Labs:</span>
                    <span>{formatDate(patient.hrt.next_lab_due)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Weight Loss */}
          {patient.weight_loss && (
            <div style={styles.serviceCard}>
              <div style={styles.serviceHeader}>
                <span style={styles.serviceName}>Weight Loss Program</span>
                <span style={{
                  ...styles.statusBadge,
                  backgroundColor: '#dcfce7',
                  color: '#166534'
                }}>
                  active
                </span>
              </div>
              <div style={styles.serviceDetails}>
                <div style={styles.detailRow}>
                  <span>Medication:</span>
                  <span>{patient.weight_loss.medication} {patient.weight_loss.current_dose}</span>
                </div>
                {patient.weight_loss.current_weight && (
                  <div style={styles.detailRow}>
                    <span>Current Weight:</span>
                    <span>{patient.weight_loss.current_weight} lbs</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Session Packs */}
          {patient.session_packs?.map((pack, i) => (
            <div key={i} style={styles.serviceCard}>
              <div style={styles.serviceHeader}>
                <span style={styles.serviceName}>{pack.package_name}</span>
                <span style={{
                  ...styles.statusBadge,
                  backgroundColor: pack.sessions_remaining > 0 ? '#dcfce7' : '#f3f4f6',
                  color: pack.sessions_remaining > 0 ? '#166534' : '#666'
                }}>
                  {pack.sessions_remaining} left
                </span>
              </div>
              <div style={styles.serviceDetails}>
                <div style={styles.progressBar}>
                  <div style={{
                    ...styles.progressFill,
                    width: `${(pack.sessions_remaining / pack.sessions_purchased) * 100}%`
                  }} />
                </div>
                <div style={styles.detailRow}>
                  <span>Used:</span>
                  <span>{pack.sessions_used} of {pack.sessions_purchased}</span>
                </div>
              </div>
            </div>
          ))}

          {/* Active Protocols */}
          {patient.protocols?.filter(p => p.status === 'active').map((protocol, i) => (
            <div key={i} style={styles.serviceCard}>
              <div style={styles.serviceHeader}>
                <span style={styles.serviceName}>{protocol.program_name}</span>
                <span style={{
                  ...styles.statusBadge,
                  backgroundColor: '#dcfce7',
                  color: '#166534'
                }}>
                  active
                </span>
              </div>
              <div style={styles.serviceDetails}>
                <div style={styles.detailRow}>
                  <span>Days Left:</span>
                  <span>{protocol.days_remaining} days</span>
                </div>
                <div style={styles.detailRow}>
                  <span>Dose:</span>
                  <span>{protocol.dose_amount} · {protocol.dose_frequency}</span>
                </div>
              </div>
            </div>
          ))}

          {!patient.hrt && !patient.weight_loss && !patient.session_packs?.length && !patient.protocols?.filter(p => p.status === 'active').length && (
            <p style={styles.emptyText}>No active services</p>
          )}
        </div>
      </section>

      {/* Recent Purchases */}
      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>Recent Purchases</h3>
        {patient.purchases?.length > 0 ? (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Item</th>
                <th style={styles.th}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {patient.purchases.slice(0, 5).map((purchase, i) => (
                <tr key={i} style={styles.tr}>
                  <td style={styles.td}>{formatDate(purchase.purchase_date)}</td>
                  <td style={styles.td}>{purchase.item_name}</td>
                  <td style={styles.td}>${purchase.amount?.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={styles.emptyText}>No purchases recorded</p>
        )}
      </section>
    </div>
  );
}

// =====================================================
// PURCHASES TAB
// =====================================================
function PurchasesTab({ purchases }) {
  if (!purchases || purchases.length === 0) {
    return <EmptyState message="No purchases recorded" />;
  }

  // Group by category
  const byCategory = purchases.reduce((acc, p) => {
    const cat = p.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {});

  const total = purchases.reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <div>
      <div style={styles.summaryBar}>
        <span>Total: <strong>${total.toFixed(2)}</strong></span>
        <span>{purchases.length} purchases</span>
      </div>

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Date</th>
            <th style={styles.th}>Category</th>
            <th style={styles.th}>Item</th>
            <th style={styles.th}>Qty</th>
            <th style={styles.th}>Amount</th>
            <th style={styles.th}>Invoice</th>
          </tr>
        </thead>
        <tbody>
          {purchases.map((purchase, i) => (
            <tr key={i} style={styles.tr}>
              <td style={styles.td}>{formatDate(purchase.purchase_date)}</td>
              <td style={styles.td}>
                <span style={styles.categoryTag}>{purchase.category || 'Other'}</span>
              </td>
              <td style={styles.td}>{purchase.item_name}</td>
              <td style={styles.td}>{purchase.quantity || 1}</td>
              <td style={styles.td}>${purchase.amount?.toFixed(2)}</td>
              <td style={styles.td}>{purchase.invoice_number || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// =====================================================
// PROTOCOLS TAB
// =====================================================
function ProtocolsTab({ protocols }) {
  if (!protocols || protocols.length === 0) {
    return <EmptyState message="No protocols found" />;
  }

  const active = protocols.filter(p => p.status === 'active');
  const completed = protocols.filter(p => p.status === 'completed');

  return (
    <div>
      {/* Active Protocols */}
      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>Active Protocols ({active.length})</h3>
        {active.length > 0 ? (
          <div style={styles.protocolGrid}>
            {active.map((protocol, i) => (
              <ProtocolCard key={i} protocol={protocol} />
            ))}
          </div>
        ) : (
          <p style={styles.emptyText}>No active protocols</p>
        )}
      </section>

      {/* Completed Protocols */}
      {completed.length > 0 && (
        <section style={styles.section}>
          <h3 style={styles.sectionTitle}>Completed Protocols ({completed.length})</h3>
          <div style={styles.protocolGrid}>
            {completed.map((protocol, i) => (
              <ProtocolCard key={i} protocol={protocol} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function ProtocolCard({ protocol }) {
  const isActive = protocol.status === 'active';
  const today = new Date();
  const endDate = protocol.end_date ? new Date(protocol.end_date) : null;
  const daysLeft = endDate ? Math.ceil((endDate - today) / (1000 * 60 * 60 * 24)) : null;

  const handleClick = () => {
    window.location.href = `/admin/protocols/${protocol.id}`;
  };

  return (
    <div style={styles.protocolCard} onClick={handleClick}>
      <div style={styles.protocolHeader}>
        <h4 style={styles.protocolName}>{protocol.program_name}</h4>
        <span style={{
          ...styles.statusBadge,
          backgroundColor: isActive ? '#dcfce7' : '#f3f4f6',
          color: isActive ? '#166534' : '#666'
        }}>
          {protocol.status}
        </span>
      </div>
      
      <div style={styles.protocolDetails}>
        {protocol.primary_peptide && (
          <div style={styles.detailRow}>
            <span>Peptide:</span>
            <span>{protocol.primary_peptide}{protocol.secondary_peptide ? ` + ${protocol.secondary_peptide}` : ''}</span>
          </div>
        )}
        <div style={styles.detailRow}>
          <span>Dose:</span>
          <span>{protocol.dose_amount} · {protocol.dose_frequency}</span>
        </div>
        <div style={styles.detailRow}>
          <span>Duration:</span>
          <span>{protocol.duration_days} days</span>
        </div>
        <div style={styles.detailRow}>
          <span>Start Date:</span>
          <span>{formatDate(protocol.start_date)}</span>
        </div>
        {endDate && (
          <div style={styles.detailRow}>
            <span>End Date:</span>
            <span>{formatDate(protocol.end_date)} {isActive && daysLeft !== null && `(${daysLeft}d left)`}</span>
          </div>
        )}
        {protocol.injections_completed !== null && (
          <div style={styles.detailRow}>
            <span>Injections:</span>
            <span>{protocol.injections_completed} completed</span>
          </div>
        )}
      </div>

      {protocol.special_instructions && (
        <div style={styles.instructions}>
          <strong>Instructions:</strong> {protocol.special_instructions}
        </div>
      )}
      
      <div style={styles.viewProtocolLink}>View Details →</div>
    </div>
  );
}

// =====================================================
// INTAKE TAB
// =====================================================
function IntakeTab({ intakes }) {
  if (!intakes || intakes.length === 0) {
    return <EmptyState message="No medical intake forms submitted" />;
  }

  return (
    <div>
      {intakes.map((intake, i) => (
        <div key={i} style={styles.intakeCard}>
          <div style={styles.intakeHeader}>
            <h4 style={styles.intakeName}>Medical Intake Form</h4>
            <span style={styles.intakeDate}>{formatDate(intake.submitted_at || intake.created_at)}</span>
          </div>

          <div style={styles.intakeGrid}>
            {/* Personal Info */}
            <div style={styles.intakeSection}>
              <h5 style={styles.intakeSectionTitle}>Personal Information</h5>
              <div style={styles.intakeField}><span>Name:</span> {intake.first_name} {intake.last_name}</div>
              <div style={styles.intakeField}><span>DOB:</span> {formatDate(intake.date_of_birth)}</div>
              <div style={styles.intakeField}><span>Gender:</span> {intake.gender}</div>
              <div style={styles.intakeField}><span>Phone:</span> {intake.phone}</div>
              <div style={styles.intakeField}><span>Email:</span> {intake.email}</div>
            </div>

            {/* Address */}
            <div style={styles.intakeSection}>
              <h5 style={styles.intakeSectionTitle}>Address</h5>
              <div style={styles.intakeField}>{intake.street_address}</div>
              <div style={styles.intakeField}>{intake.city}, {intake.state} {intake.postal_code}</div>
            </div>

            {/* Visit Reason */}
            <div style={styles.intakeSection}>
              <h5 style={styles.intakeSectionTitle}>Reason for Visit</h5>
              <div style={styles.intakeField}>{intake.what_brings_you_in || intake.what_brings_you || 'Not specified'}</div>
            </div>

            {/* Medical Conditions */}
            <div style={styles.intakeSection}>
              <h5 style={styles.intakeSectionTitle}>Medical Conditions</h5>
              {intake.high_blood_pressure && <div style={styles.conditionTag}>High Blood Pressure {intake.high_blood_pressure_year && `(${intake.high_blood_pressure_year})`}</div>}
              {intake.high_cholesterol && <div style={styles.conditionTag}>High Cholesterol {intake.high_cholesterol_year && `(${intake.high_cholesterol_year})`}</div>}
              {intake.heart_disease && <div style={styles.conditionTag}>Heart Disease {intake.heart_disease_type && `- ${intake.heart_disease_type}`}</div>}
              {intake.diabetes && <div style={styles.conditionTag}>Diabetes {intake.diabetes_type && `- ${intake.diabetes_type}`}</div>}
              {intake.thyroid_disorder && <div style={styles.conditionTag}>Thyroid Disorder {intake.thyroid_disorder_type && `- ${intake.thyroid_disorder_type}`}</div>}
              {intake.depression_anxiety && <div style={styles.conditionTag}>Depression/Anxiety</div>}
              {intake.kidney_disease && <div style={styles.conditionTag}>Kidney Disease {intake.kidney_disease_type && `- ${intake.kidney_disease_type}`}</div>}
              {intake.liver_disease && <div style={styles.conditionTag}>Liver Disease {intake.liver_disease_type && `- ${intake.liver_disease_type}`}</div>}
              {intake.autoimmune_disorder && <div style={styles.conditionTag}>Autoimmune Disorder {intake.autoimmune_disorder_type && `- ${intake.autoimmune_disorder_type}`}</div>}
              {intake.cancer && <div style={styles.conditionTag}>Cancer {intake.cancer_type && `- ${intake.cancer_type}`}</div>}
              {!intake.high_blood_pressure && !intake.high_cholesterol && !intake.heart_disease && !intake.diabetes && !intake.thyroid_disorder && !intake.depression_anxiety && !intake.kidney_disease && !intake.liver_disease && !intake.autoimmune_disorder && !intake.cancer && (
                <span style={styles.emptyText}>None reported</span>
              )}
            </div>

            {/* Medications */}
            <div style={styles.intakeSection}>
              <h5 style={styles.intakeSectionTitle}>Current Medications</h5>
              {intake.on_medications || intake.on_other_medications ? (
                <div style={styles.intakeField}>{intake.current_medications || 'Not specified'}</div>
              ) : (
                <span style={styles.emptyText}>None</span>
              )}
            </div>

            {/* HRT */}
            <div style={styles.intakeSection}>
              <h5 style={styles.intakeSectionTitle}>Hormone Therapy</h5>
              {intake.on_hrt ? (
                <div style={styles.intakeField}>{intake.hrt_details || 'Currently on HRT'}</div>
              ) : (
                <span style={styles.emptyText}>Not on HRT</span>
              )}
            </div>

            {/* Allergies */}
            <div style={styles.intakeSection}>
              <h5 style={styles.intakeSectionTitle}>Allergies</h5>
              {intake.has_allergies ? (
                <>
                  <div style={styles.intakeField}>{intake.allergies}</div>
                  {intake.allergy_reactions && <div style={styles.intakeField}><em>Reactions: {intake.allergy_reactions}</em></div>}
                </>
              ) : (
                <span style={styles.emptyText}>No known allergies</span>
              )}
            </div>

            {/* Injury */}
            {(intake.currently_injured || intake.injured) && (
              <div style={styles.intakeSection}>
                <h5 style={styles.intakeSectionTitle}>Current Injury</h5>
                <div style={styles.intakeField}>{intake.injury_description}</div>
                {intake.injury_location && <div style={styles.intakeField}>Location: {intake.injury_location}</div>}
                {(intake.injury_date || intake.injury_when_occurred) && <div style={styles.intakeField}>When: {intake.injury_date || intake.injury_when_occurred}</div>}
              </div>
            )}
          </div>

          {/* Documents */}
          <div style={styles.intakeDocuments}>
            {intake.pdf_url && (
              <a href={intake.pdf_url} target="_blank" rel="noopener noreferrer" style={styles.docLink}>
                View PDF
              </a>
            )}
            {intake.signature_url && (
              <a href={intake.signature_url} target="_blank" rel="noopener noreferrer" style={styles.docLink}>
                View Signature
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// =====================================================
// INJECTIONS TAB
// =====================================================
function InjectionsTab({ patient, onRefresh }) {
  const [showLogForm, setShowLogForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    injection_type: 'hrt',
    injection_date: new Date().toISOString().split('T')[0],
    injection_site: 'abdomen',
    location: 'in_clinic',
    dose: '',
    notes: ''
  });

  // Build injection type options
  const injectionOptions = [];
  if (patient.hrt) injectionOptions.push({ value: 'hrt', label: 'HRT - Testosterone' });
  if (patient.weight_loss) injectionOptions.push({ value: 'weight_loss', label: `Weight Loss - ${patient.weight_loss.medication}` });
  patient.protocols?.filter(p => p.status === 'active').forEach(p => {
    injectionOptions.push({ value: `peptide_${p.id}`, label: `Peptide - ${p.program_name}` });
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('/api/admin/log-injection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: patient.id,
          ...formData
        })
      });

      const result = await response.json();
      if (result.success) {
        setShowLogForm(false);
        setFormData({
          ...formData,
          injection_date: new Date().toISOString().split('T')[0],
          notes: '',
          dose: ''
        });
        onRefresh();
      } else {
        alert('Error logging injection: ' + result.error);
      }
    } catch (err) {
      alert('Error logging injection');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div style={styles.sectionHeader}>
        <h3 style={styles.sectionTitle}>Injection Log</h3>
        <button onClick={() => setShowLogForm(!showLogForm)} style={styles.addBtn}>
          {showLogForm ? 'Cancel' : '+ Log Injection'}
        </button>
      </div>

      {/* Log Form */}
      {showLogForm && (
        <div style={styles.logFormCard}>
          <h4 style={styles.formTitle}>Log New Injection</h4>
          <form onSubmit={handleSubmit} style={styles.logFormGrid}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Type</label>
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
              <label style={styles.label}>Location</label>
              <select
                value={formData.location}
                onChange={e => setFormData({...formData, location: e.target.value})}
                style={styles.select}
              >
                <option value="in_clinic">In Clinic</option>
                <option value="take_home">Take Home (Patient Logged)</option>
              </select>
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

            <div style={styles.formGroup}>
              <label style={styles.label}>Dose (optional)</label>
              <input
                type="text"
                placeholder="e.g., 0.5ml, 200mg"
                value={formData.dose}
                onChange={e => setFormData({...formData, dose: e.target.value})}
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Notes (optional)</label>
              <input
                type="text"
                placeholder="Any notes..."
                value={formData.notes}
                onChange={e => setFormData({...formData, notes: e.target.value})}
                style={styles.input}
              />
            </div>

            <div style={styles.formActions}>
              <button type="submit" style={styles.submitBtn} disabled={submitting}>
                {submitting ? 'Saving...' : 'Log Injection'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Injection History */}
      {patient.injection_log?.length > 0 ? (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Date</th>
              <th style={styles.th}>Type</th>
              <th style={styles.th}>Medication</th>
              <th style={styles.th}>Site</th>
              <th style={styles.th}>Location</th>
              <th style={styles.th}>Logged By</th>
              <th style={styles.th}>Notes</th>
            </tr>
          </thead>
          <tbody>
            {patient.injection_log.map((log, i) => (
              <tr key={i} style={styles.tr}>
                <td style={styles.td}>{formatDate(log.injection_date)}</td>
                <td style={styles.td}>
                  <span style={styles.typeTag}>{log.injection_type}</span>
                </td>
                <td style={styles.td}>{log.medication || '-'}</td>
                <td style={styles.td}>{log.injection_site || '-'}</td>
                <td style={styles.td}>
                  <span style={{
                    ...styles.locationTag,
                    backgroundColor: log.location === 'in_clinic' ? '#dcfce7' : '#e0e7ff',
                    color: log.location === 'in_clinic' ? '#166534' : '#4338ca'
                  }}>
                    {log.location === 'in_clinic' ? 'In Clinic' : 'Take Home'}
                  </span>
                </td>
                <td style={styles.td}>{log.logged_by || '-'}</td>
                <td style={styles.td}>{log.notes || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <EmptyState message="No injections logged yet" />
      )}
    </div>
  );
}

// =====================================================
// CONSENTS TAB
// =====================================================
function ConsentsTab({ consents }) {
  if (!consents || consents.length === 0) {
    return <EmptyState message="No consent forms submitted" />;
  }

  return (
    <div>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Date</th>
            <th style={styles.th}>Consent Type</th>
            <th style={styles.th}>Name</th>
            <th style={styles.th}>Status</th>
            <th style={styles.th}>Documents</th>
          </tr>
        </thead>
        <tbody>
          {consents.map((consent, i) => (
            <tr key={i} style={styles.tr}>
              <td style={styles.td}>{formatDate(consent.submitted_at || consent.consent_date)}</td>
              <td style={styles.td}>{consent.consent_type}</td>
              <td style={styles.td}>{consent.first_name} {consent.last_name}</td>
              <td style={styles.td}>
                <span style={{
                  ...styles.statusBadge,
                  backgroundColor: consent.consent_given ? '#dcfce7' : '#fee2e2',
                  color: consent.consent_given ? '#166534' : '#991b1b'
                }}>
                  {consent.consent_given ? 'Signed' : 'Not Signed'}
                </span>
              </td>
              <td style={styles.td}>
                {consent.pdf_url && (
                  <a href={consent.pdf_url} target="_blank" rel="noopener noreferrer" style={styles.docLinkSmall}>
                    PDF
                  </a>
                )}
                {consent.signature_url && (
                  <a href={consent.signature_url} target="_blank" rel="noopener noreferrer" style={styles.docLinkSmall}>
                    Signature
                  </a>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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
  if (!dateStr) return '-';
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
    backgroundColor: '#fafafa',
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
  errorState: {
    textAlign: 'center',
    padding: '64px',
    color: '#666'
  },
  
  // Header
  header: {
    backgroundColor: '#fff',
    borderBottom: '1px solid #e5e5e5',
    padding: '24px 32px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  headerLeft: {},
  headerRight: {},
  backLink: {
    background: 'none',
    border: 'none',
    color: '#666',
    fontSize: '14px',
    cursor: 'pointer',
    padding: 0,
    marginBottom: '8px',
    display: 'block'
  },
  backBtn: {
    padding: '10px 20px',
    backgroundColor: '#000',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    marginTop: '16px'
  },
  patientName: {
    fontSize: '28px',
    fontWeight: '600',
    margin: 0,
    color: '#000'
  },
  patientMeta: {
    fontSize: '14px',
    color: '#666',
    marginTop: '4px'
  },
  ghlBtn: {
    padding: '10px 20px',
    backgroundColor: '#000',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer'
  },
  
  // Tabs
  tabs: {
    backgroundColor: '#fff',
    borderBottom: '1px solid #e5e5e5',
    padding: '0 32px',
    display: 'flex',
    gap: '8px'
  },
  tabBtn: {
    background: 'none',
    border: 'none',
    borderBottom: '2px solid transparent',
    padding: '16px 20px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.15s'
  },
  
  // Main
  main: {
    padding: '32px',
    maxWidth: '1200px',
    margin: '0 auto'
  },
  
  // Sections
  section: {
    marginBottom: '32px'
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    margin: '0 0 16px 0',
    color: '#000'
  },
  
  // Overview Grid
  overviewGrid: {
    display: 'grid',
    gap: '32px'
  },
  servicesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '16px'
  },
  
  // Service Card
  serviceCard: {
    backgroundColor: '#fff',
    border: '1px solid #e5e5e5',
    borderRadius: '8px',
    padding: '16px'
  },
  serviceHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px'
  },
  serviceName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#000'
  },
  serviceDetails: {},
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    marginBottom: '6px',
    color: '#374151'
  },
  
  // Status Badge
  statusBadge: {
    padding: '4px 10px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase'
  },
  
  // Progress Bar
  progressBar: {
    height: '6px',
    backgroundColor: '#f0f0f0',
    borderRadius: '3px',
    overflow: 'hidden',
    marginBottom: '8px'
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#000',
    borderRadius: '3px'
  },
  
  // Table
  table: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: '8px',
    border: '1px solid #e5e5e5',
    borderCollapse: 'collapse'
  },
  th: {
    textAlign: 'left',
    padding: '12px 16px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    borderBottom: '1px solid #e5e5e5'
  },
  tr: {
    borderBottom: '1px solid #f0f0f0'
  },
  td: {
    padding: '12px 16px',
    fontSize: '14px',
    color: '#374151'
  },
  
  // Category Tag
  categoryTag: {
    padding: '4px 8px',
    backgroundColor: '#f3f4f6',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '500'
  },
  
  // Summary Bar
  summaryBar: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px 16px',
    backgroundColor: '#fff',
    border: '1px solid #e5e5e5',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '14px',
    color: '#374151'
  },
  
  // Protocol Card
  protocolGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '16px'
  },
  protocolCard: {
    backgroundColor: '#fff',
    border: '1px solid #e5e5e5',
    borderRadius: '8px',
    padding: '16px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    ':hover': {
      borderColor: '#000',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
    }
  },
  protocolHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px'
  },
  protocolName: {
    fontSize: '14px',
    fontWeight: '600',
    margin: 0,
    color: '#000'
  },
  protocolDetails: {
    marginBottom: '12px'
  },
  viewProtocolLink: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#000',
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid #f0f0f0'
  },
  instructions: {
    fontSize: '12px',
    color: '#666',
    padding: '8px',
    backgroundColor: '#f9f9f9',
    borderRadius: '4px'
  },
  
  // Intake Card
  intakeCard: {
    backgroundColor: '#fff',
    border: '1px solid #e5e5e5',
    borderRadius: '8px',
    marginBottom: '16px',
    overflow: 'hidden'
  },
  intakeHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    borderBottom: '1px solid #e5e5e5'
  },
  intakeName: {
    fontSize: '16px',
    fontWeight: '600',
    margin: 0
  },
  intakeDate: {
    fontSize: '13px',
    color: '#666'
  },
  intakeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '16px',
    padding: '16px'
  },
  intakeSection: {
    marginBottom: '8px'
  },
  intakeSectionTitle: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    margin: '0 0 8px 0'
  },
  intakeField: {
    fontSize: '14px',
    color: '#374151',
    marginBottom: '4px'
  },
  conditionTag: {
    display: 'inline-block',
    padding: '4px 8px',
    backgroundColor: '#fef3c7',
    color: '#92400e',
    borderRadius: '4px',
    fontSize: '12px',
    marginRight: '6px',
    marginBottom: '6px'
  },
  intakeDocuments: {
    padding: '12px 16px',
    borderTop: '1px solid #e5e5e5',
    display: 'flex',
    gap: '12px'
  },
  docLink: {
    padding: '8px 16px',
    backgroundColor: '#f3f4f6',
    color: '#374151',
    borderRadius: '6px',
    fontSize: '13px',
    textDecoration: 'none',
    fontWeight: '500'
  },
  docLinkSmall: {
    padding: '4px 8px',
    backgroundColor: '#f3f4f6',
    color: '#374151',
    borderRadius: '4px',
    fontSize: '12px',
    textDecoration: 'none',
    marginRight: '6px'
  },
  
  // Empty State
  emptyState: {
    textAlign: 'center',
    padding: '48px',
    color: '#666'
  },
  emptyText: {
    color: '#999',
    fontSize: '13px'
  },
  
  // Injection Form Styles
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  },
  addBtn: {
    padding: '8px 16px',
    backgroundColor: '#000',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer'
  },
  logFormCard: {
    backgroundColor: '#f9f9f9',
    border: '1px solid #e5e5e5',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '24px'
  },
  formTitle: {
    fontSize: '14px',
    fontWeight: '600',
    margin: '0 0 16px 0'
  },
  logFormGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: '16px'
  },
  formGroup: {
    marginBottom: '0'
  },
  label: {
    display: 'block',
    fontSize: '12px',
    fontWeight: '500',
    marginBottom: '6px',
    color: '#374151'
  },
  input: {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #e5e5e5',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box'
  },
  select: {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #e5e5e5',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    backgroundColor: '#fff'
  },
  formActions: {
    display: 'flex',
    alignItems: 'flex-end'
  },
  submitBtn: {
    padding: '8px 20px',
    backgroundColor: '#000',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer'
  },
  typeTag: {
    padding: '4px 8px',
    backgroundColor: '#f3f4f6',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '500',
    textTransform: 'capitalize'
  },
  locationTag: {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '600'
  }
};
