// /pages/admin/patient/[id].js
// Patient Profile Page with Progress Tracking
// Range Medical

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

export default function PatientProfile() {
  const router = useRouter();
  const { id } = router.query;
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [patient, setPatient] = useState(null);
  const [protocols, setProtocols] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [questionnaires, setQuestionnaires] = useState([]);
  const [sendingReminder, setSendingReminder] = useState(null);

  const sendReminder = async (protocolId, reminderType) => {
    setSendingReminder(`${protocolId}-${reminderType}`);
    try {
      const res = await fetch('/api/admin/send-questionnaire-reminder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${password}`
        },
        body: JSON.stringify({ protocol_id: protocolId, reminder_type: reminderType })
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Reminder sent!`);
      } else {
        alert(data.error || 'Failed to send');
      }
    } catch (err) {
      alert('Error sending reminder');
    }
    setSendingReminder(null);
  };

  useEffect(() => {
    const stored = localStorage.getItem('adminPassword');
    if (stored) {
      setPassword(stored);
      setIsAuthenticated(true);
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && id) fetchPatientData();
  }, [isAuthenticated, id]);

  const fetchPatientData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/patient/${id}`, {
        headers: { 'Authorization': `Bearer ${password}` }
      });
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setPatient(data.patient);
      setProtocols(data.protocols || []);
      setPurchases(data.purchases || []);
      setQuestionnaires(data.questionnaires || []);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-';
  const formatCurrency = (a) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(a || 0);

  const getStatusColor = (s) => ({ active: '#4caf50', completed: '#2196f3', paused: '#ff9800', cancelled: '#f44336' }[s] || '#666');
  const getCategoryColor = (c) => ({ 'Peptide': '#4caf50', 'Weight Loss': '#ff9800', 'HRT': '#1565c0', 'IV Therapy': '#9c27b0', 'Injection': '#e91e63', 'Labs': '#00bcd4' }[c] || '#666');

  // Get questionnaires for a specific protocol
  const getProtocolQuestionnaires = (protocolId) => {
    return questionnaires.filter(q => q.protocol_id === protocolId);
  };

  // Calculate improvement between two questionnaires
  const calculateImprovement = (intake, completion) => {
    if (!intake || !completion) return null;
    return {
      pain: intake.pain_level - completion.pain_level, // positive = improvement
      mobility: completion.mobility_score - intake.mobility_score, // positive = improvement
      sleep: completion.sleep_quality - intake.sleep_quality,
      energy: completion.energy_level - intake.energy_level
    };
  };

  // Get overall progress across all protocols
  const getOverallProgress = () => {
    const intakes = questionnaires.filter(q => q.questionnaire_type === 'intake').sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    const completions = questionnaires.filter(q => q.questionnaire_type === 'completion').sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    if (intakes.length === 0) return null;
    
    const firstIntake = intakes[0];
    const latestCompletion = completions[0];
    const latestIntake = intakes[intakes.length - 1];
    
    return {
      firstIntake,
      latestCompletion,
      latestIntake,
      totalImprovement: latestCompletion ? calculateImprovement(firstIntake, latestCompletion) : null
    };
  };

  const overallProgress = getOverallProgress();

  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui' }}>
        <p>Please log in through the <Link href="/admin/dashboard" style={{ color: '#1976d2' }}>dashboard</Link></p>
      </div>
    );
  }

  return (
    <>
      <Head><title>{patient?.name || 'Patient'} | Range Medical</title></Head>
      <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: 'system-ui' }}>
        {/* Header */}
        <header style={{ background: 'black', color: 'white', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '600' }}>RANGE MEDICAL</h1>
            <p style={{ margin: '4px 0 0', fontSize: '14px', opacity: 0.8 }}>Patient Profile</p>
          </div>
          <button onClick={() => { localStorage.removeItem('adminPassword'); setIsAuthenticated(false); }}
            style={{ padding: '8px 16px', background: 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '4px', cursor: 'pointer' }}>
            Logout
          </button>
        </header>

        {/* Nav */}
        <nav style={{ background: 'white', borderBottom: '1px solid #e0e0e0', padding: '0 24px', display: 'flex' }}>
          {[{ href: '/admin/dashboard', label: 'Dashboard' }, { href: '/admin/protocols', label: 'Protocols' }, { href: '/admin/purchases', label: 'Purchases' }, { href: '/admin/patients', label: 'Patients', active: true }].map(item => (
            <Link key={item.href} href={item.href} style={{ padding: '16px 20px', color: item.active ? 'black' : '#666', textDecoration: 'none', borderBottom: item.active ? '2px solid black' : '2px solid transparent', fontWeight: item.active ? '500' : '400', fontSize: '14px' }}>
              {item.label}
            </Link>
          ))}
        </nav>

        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#666' }}>Loading...</div>
        ) : error ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#c62828' }}>{error}</div>
        ) : patient ? (
          <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
            <Link href="/admin/patients" style={{ color: '#666', textDecoration: 'none', fontSize: '14px', display: 'inline-block', marginBottom: '16px' }}>← Back to Patients</Link>

            {/* Patient Info Card */}
            <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '24px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h2 style={{ margin: '0 0 8px', fontSize: '28px', fontWeight: '600' }}>{patient.name}</h2>
                  <div style={{ display: 'flex', gap: '24px', color: '#666', fontSize: '14px' }}>
                    {patient.email && <span>📧 {patient.email}</span>}
                    {patient.phone && <span>📱 {patient.phone}</span>}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Total Spent</div>
                  <div style={{ fontSize: '24px', fontWeight: '600', color: '#2e7d32' }}>
                    {formatCurrency(purchases.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0))}
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div style={{ display: 'flex', gap: '24px', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #eee' }}>
                <div><div style={{ fontSize: '24px', fontWeight: '600' }}>{protocols.length}</div><div style={{ fontSize: '13px', color: '#666' }}>Protocols</div></div>
                <div><div style={{ fontSize: '24px', fontWeight: '600', color: '#4caf50' }}>{protocols.filter(p => p.status === 'active').length}</div><div style={{ fontSize: '13px', color: '#666' }}>Active</div></div>
                <div><div style={{ fontSize: '24px', fontWeight: '600', color: '#2196f3' }}>{protocols.filter(p => p.status === 'completed').length}</div><div style={{ fontSize: '13px', color: '#666' }}>Completed</div></div>
                <div><div style={{ fontSize: '24px', fontWeight: '600' }}>{questionnaires.length}</div><div style={{ fontSize: '13px', color: '#666' }}>Assessments</div></div>
              </div>
            </div>

            {/* Overall Progress Card */}
            {overallProgress && overallProgress.firstIntake && (
              <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '24px', marginBottom: '24px' }}>
                <h3 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: '600', borderBottom: '2px solid black', paddingBottom: '8px' }}>
                  Recovery Progress Overview
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: overallProgress.latestCompletion ? '1fr auto 1fr' : '1fr', gap: '20px', alignItems: 'center' }}>
                  {/* First Intake */}
                  <div style={{ background: '#f5f5f5', borderRadius: '8px', padding: '16px' }}>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '12px', fontWeight: '600' }}>FIRST ASSESSMENT</div>
                    <div style={{ fontSize: '11px', color: '#999', marginBottom: '8px' }}>{formatDate(overallProgress.firstIntake.created_at)}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', textAlign: 'center' }}>
                      <div>
                        <div style={{ fontSize: '20px', fontWeight: '700', color: overallProgress.firstIntake.pain_level > 6 ? '#c62828' : overallProgress.firstIntake.pain_level > 3 ? '#ef6c00' : '#2e7d32' }}>{overallProgress.firstIntake.pain_level}</div>
                        <div style={{ fontSize: '10px', color: '#666' }}>Pain</div>
                      </div>
                      <div><div style={{ fontSize: '20px', fontWeight: '700' }}>{overallProgress.firstIntake.mobility_score}</div><div style={{ fontSize: '10px', color: '#666' }}>Mobility</div></div>
                      <div><div style={{ fontSize: '20px', fontWeight: '700' }}>{overallProgress.firstIntake.sleep_quality}</div><div style={{ fontSize: '10px', color: '#666' }}>Sleep</div></div>
                      <div><div style={{ fontSize: '20px', fontWeight: '700' }}>{overallProgress.firstIntake.energy_level}</div><div style={{ fontSize: '10px', color: '#666' }}>Energy</div></div>
                    </div>
                    {overallProgress.firstIntake.injury_location && (
                      <div style={{ marginTop: '12px', fontSize: '12px', color: '#666' }}>
                        <strong>Focus:</strong> {overallProgress.firstIntake.injury_location}
                      </div>
                    )}
                  </div>

                  {/* Arrow & Improvement */}
                  {overallProgress.totalImprovement && (
                    <>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '24px', color: '#4caf50' }}>→</div>
                        <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                          {protocols.filter(p => p.status === 'completed').length} protocols
                        </div>
                      </div>

                      {/* Latest Completion */}
                      <div style={{ background: '#e8f5e9', borderRadius: '8px', padding: '16px', border: '2px solid #4caf50' }}>
                        <div style={{ fontSize: '12px', color: '#2e7d32', marginBottom: '12px', fontWeight: '600' }}>LATEST RESULTS</div>
                        <div style={{ fontSize: '11px', color: '#666', marginBottom: '8px' }}>{formatDate(overallProgress.latestCompletion.created_at)}</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', textAlign: 'center' }}>
                          <div>
                            <div style={{ fontSize: '20px', fontWeight: '700', color: '#2e7d32' }}>
                              {overallProgress.latestCompletion.pain_level}
                              <span style={{ fontSize: '11px', marginLeft: '2px', color: overallProgress.totalImprovement.pain > 0 ? '#4caf50' : '#c62828' }}>
                                ({overallProgress.totalImprovement.pain > 0 ? '↓' : '↑'}{Math.abs(overallProgress.totalImprovement.pain)})
                              </span>
                            </div>
                            <div style={{ fontSize: '10px', color: '#666' }}>Pain</div>
                          </div>
                          <div>
                            <div style={{ fontSize: '20px', fontWeight: '700' }}>
                              {overallProgress.latestCompletion.mobility_score}
                              <span style={{ fontSize: '11px', marginLeft: '2px', color: overallProgress.totalImprovement.mobility > 0 ? '#4caf50' : '#c62828' }}>
                                ({overallProgress.totalImprovement.mobility > 0 ? '↑' : '↓'}{Math.abs(overallProgress.totalImprovement.mobility)})
                              </span>
                            </div>
                            <div style={{ fontSize: '10px', color: '#666' }}>Mobility</div>
                          </div>
                          <div>
                            <div style={{ fontSize: '20px', fontWeight: '700' }}>
                              {overallProgress.latestCompletion.sleep_quality}
                              <span style={{ fontSize: '11px', marginLeft: '2px', color: overallProgress.totalImprovement.sleep > 0 ? '#4caf50' : '#c62828' }}>
                                ({overallProgress.totalImprovement.sleep > 0 ? '↑' : '↓'}{Math.abs(overallProgress.totalImprovement.sleep)})
                              </span>
                            </div>
                            <div style={{ fontSize: '10px', color: '#666' }}>Sleep</div>
                          </div>
                          <div>
                            <div style={{ fontSize: '20px', fontWeight: '700' }}>
                              {overallProgress.latestCompletion.energy_level}
                              <span style={{ fontSize: '11px', marginLeft: '2px', color: overallProgress.totalImprovement.energy > 0 ? '#4caf50' : '#c62828' }}>
                                ({overallProgress.totalImprovement.energy > 0 ? '↑' : '↓'}{Math.abs(overallProgress.totalImprovement.energy)})
                              </span>
                            </div>
                            <div style={{ fontSize: '10px', color: '#666' }}>Energy</div>
                          </div>
                        </div>
                        {overallProgress.latestCompletion.continue_treatment && (
                          <div style={{ marginTop: '12px', fontSize: '12px', color: '#2e7d32', textAlign: 'center' }}>
                            ✓ Interested in continuing
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Protocols with Questionnaires */}
            <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden', marginBottom: '24px' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #e0e0e0' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Protocol History & Assessments</h3>
              </div>
              
              {protocols.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>No protocols found</div>
              ) : (
                <div>
                  {protocols.map(protocol => {
                    const protocolQs = getProtocolQuestionnaires(protocol.id);
                    const intake = protocolQs.find(q => q.questionnaire_type === 'intake');
                    const completion = protocolQs.find(q => q.questionnaire_type === 'completion');
                    const improvement = calculateImprovement(intake, completion);
                    const daysLeft = protocol.end_date ? Math.ceil((new Date(protocol.end_date) - new Date()) / (1000*60*60*24)) : 0;
                    
                    return (
                      <div key={protocol.id} style={{ padding: '20px', borderBottom: '1px solid #f0f0f0' }}>
                        {/* Protocol Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                          <div>
                            <div style={{ fontWeight: '600', fontSize: '15px' }}>{protocol.program_name}</div>
                            <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                              {formatDate(protocol.start_date)} - {formatDate(protocol.end_date)}
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{
                              padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '500',
                              background: `${getStatusColor(protocol.status)}15`, color: getStatusColor(protocol.status)
                            }}>
                              {protocol.status}
                            </span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(`https://app.range-medical.com/track/${protocol.access_token}`);
                                alert('Tracker link copied!');
                              }}
                              style={{ padding: '4px 8px', background: '#f5f5f5', border: '1px solid #ddd', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}
                            >
                              📱 Copy Link
                            </button>
                          </div>
                        </div>

                        {/* Assessment Status */}
                        <div style={{ display: 'flex', gap: '16px', marginBottom: intake || completion ? '12px' : '0', flexWrap: 'wrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: intake ? '#4caf50' : '#ddd' }} />
                            <span style={{ fontSize: '12px', color: intake ? '#4caf50' : '#999' }}>
                              {intake ? 'Intake complete' : 'Intake pending'}
                            </span>
                            {!intake && protocol.ghl_contact_id && (
                              <button
                                onClick={() => sendReminder(protocol.id, 'intake')}
                                disabled={sendingReminder === `${protocol.id}-intake`}
                                style={{
                                  padding: '2px 8px', marginLeft: '4px', fontSize: '10px', 
                                  background: '#fff', border: '1px solid #ddd', borderRadius: '4px', 
                                  cursor: 'pointer', color: '#666'
                                }}
                              >
                                {sendingReminder === `${protocol.id}-intake` ? 'Sending...' : 'Send Reminder'}
                              </button>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: completion ? '#4caf50' : '#ddd' }} />
                            <span style={{ fontSize: '12px', color: completion ? '#4caf50' : '#999' }}>
                              {completion ? 'Completion complete' : daysLeft <= 2 && protocol.status === 'active' ? 'Completion due!' : 'Completion pending'}
                            </span>
                            {!completion && intake && protocol.ghl_contact_id && (
                              <button
                                onClick={() => sendReminder(protocol.id, 'completion')}
                                disabled={sendingReminder === `${protocol.id}-completion`}
                                style={{
                                  padding: '2px 8px', marginLeft: '4px', fontSize: '10px', 
                                  background: daysLeft <= 2 ? '#fff3e0' : '#fff', 
                                  border: daysLeft <= 2 ? '1px solid #ff9800' : '1px solid #ddd', 
                                  borderRadius: '4px', cursor: 'pointer', 
                                  color: daysLeft <= 2 ? '#e65100' : '#666'
                                }}
                              >
                                {sendingReminder === `${protocol.id}-completion` ? 'Sending...' : 'Send Reminder'}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Scores */}
                        {(intake || completion) && (
                          <div style={{ display: 'flex', gap: '20px', background: '#fafafa', borderRadius: '8px', padding: '12px 16px' }}>
                            {intake && (
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '10px', color: '#666', marginBottom: '8px', fontWeight: '600' }}>INTAKE</div>
                                <div style={{ display: 'flex', gap: '16px' }}>
                                  <div><span style={{ fontWeight: '600' }}>{intake.pain_level}</span> <span style={{ fontSize: '11px', color: '#666' }}>pain</span></div>
                                  <div><span style={{ fontWeight: '600' }}>{intake.mobility_score}</span> <span style={{ fontSize: '11px', color: '#666' }}>mobility</span></div>
                                  <div><span style={{ fontWeight: '600' }}>{intake.sleep_quality}</span> <span style={{ fontSize: '11px', color: '#666' }}>sleep</span></div>
                                  <div><span style={{ fontWeight: '600' }}>{intake.energy_level}</span> <span style={{ fontSize: '11px', color: '#666' }}>energy</span></div>
                                </div>
                                {intake.injury_location && (
                                  <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                                    <strong>Focus:</strong> {intake.injury_location} — {intake.primary_complaint}
                                  </div>
                                )}
                              </div>
                            )}
                            {completion && (
                              <div style={{ flex: 1, borderLeft: intake ? '1px solid #e0e0e0' : 'none', paddingLeft: intake ? '20px' : '0' }}>
                                <div style={{ fontSize: '10px', color: '#2e7d32', marginBottom: '8px', fontWeight: '600' }}>COMPLETION</div>
                                <div style={{ display: 'flex', gap: '16px' }}>
                                  <div>
                                    <span style={{ fontWeight: '600' }}>{completion.pain_level}</span>
                                    {improvement && <span style={{ fontSize: '11px', marginLeft: '2px', color: improvement.pain > 0 ? '#4caf50' : '#c62828' }}>({improvement.pain > 0 ? '↓' : '↑'}{Math.abs(improvement.pain)})</span>}
                                    <span style={{ fontSize: '11px', color: '#666' }}> pain</span>
                                  </div>
                                  <div>
                                    <span style={{ fontWeight: '600' }}>{completion.mobility_score}</span>
                                    {improvement && <span style={{ fontSize: '11px', marginLeft: '2px', color: improvement.mobility > 0 ? '#4caf50' : '#c62828' }}>({improvement.mobility > 0 ? '↑' : '↓'}{Math.abs(improvement.mobility)})</span>}
                                    <span style={{ fontSize: '11px', color: '#666' }}> mobility</span>
                                  </div>
                                  <div><span style={{ fontWeight: '600' }}>{completion.overall_improvement}</span> <span style={{ fontSize: '11px', color: '#666' }}>improvement</span></div>
                                </div>
                                {completion.goals_achieved && (
                                  <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                                    <strong>Improvements:</strong> {completion.goals_achieved}
                                  </div>
                                )}
                                {completion.continue_treatment && (
                                  <div style={{ fontSize: '12px', color: '#2e7d32', marginTop: '4px' }}>✓ Wants to continue</div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Purchases */}
            <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Purchase History</h3>
                <span style={{ fontSize: '13px', color: '#666' }}>{purchases.length} total</span>
              </div>
              {purchases.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>No purchases found</div>
              ) : (
                <div style={{ maxHeight: '300px', overflow: 'auto' }}>
                  {purchases.map(purchase => (
                    <div key={purchase.id} style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: '500', fontSize: '14px' }}>{purchase.item_name}</div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                          <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '500', background: `${getCategoryColor(purchase.category)}15`, color: getCategoryColor(purchase.category) }}>
                            {purchase.category}
                          </span>
                          <span style={{ fontSize: '12px', color: '#666' }}>{formatDate(purchase.purchase_date)}</span>
                        </div>
                      </div>
                      <div style={{ fontWeight: '600', fontSize: '14px' }}>{formatCurrency(purchase.amount)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ padding: '60px', textAlign: 'center', color: '#666' }}>Patient not found</div>
        )}
      </div>
    </>
  );
}
