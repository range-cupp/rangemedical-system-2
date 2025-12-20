// /pages/my/[token].js
// Patient Portal - My Dashboard
// Shows patient their complete history, active protocols, purchases
// Range Medical

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function PatientPortal() {
  const router = useRouter();
  const { token } = router.query;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  
  // Weight tracking state
  const [weightLogs, setWeightLogs] = useState({ logs: [], stats: {} });
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [newWeight, setNewWeight] = useState('');
  const [savingWeight, setSavingWeight] = useState(false);

  useEffect(() => {
    if (token) {
      fetchPatientData();
    }
  }, [token]);

  const fetchPatientData = async () => {
    try {
      const res = await fetch(`/api/patient/portal?token=${token}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
        
        // Check if there's a weight loss protocol and fetch weight logs
        const weightLossProtocol = json.protocols?.find(p => 
          p.program_type?.includes('weight_loss') || 
          p.program_name?.toLowerCase().includes('weight loss')
        );
        if (weightLossProtocol?.access_token) {
          fetchWeightLogs(weightLossProtocol.access_token);
        }
      } else {
        setError('Unable to load your information. Please check your link.');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    }
    setLoading(false);
  };

  const fetchWeightLogs = async (protocolToken) => {
    try {
      const res = await fetch(`/api/patient/weight?token=${protocolToken}`);
      if (res.ok) {
        const json = await res.json();
        setWeightLogs(json);
      }
    } catch (err) {
      console.error('Failed to fetch weight logs:', err);
    }
  };

  const handleSaveWeight = async () => {
    if (!newWeight) return;
    
    const weightLossProtocol = data?.protocols?.find(p => 
      p.program_type?.includes('weight_loss') || 
      p.program_name?.toLowerCase().includes('weight loss')
    );
    
    if (!weightLossProtocol?.access_token) return;
    
    setSavingWeight(true);
    try {
      const res = await fetch(`/api/patient/weight?token=${weightLossProtocol.access_token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weight: parseFloat(newWeight) })
      });
      
      if (res.ok) {
        setShowWeightModal(false);
        setNewWeight('');
        fetchWeightLogs(weightLossProtocol.access_token);
      }
    } catch (err) {
      alert('Error saving weight');
    } finally {
      setSavingWeight(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getDaysRemaining = (endDate) => {
    if (!endDate) return null;
    const end = new Date(endDate);
    const today = new Date();
    return Math.ceil((end - today) / (1000 * 60 * 60 * 24));
  };

  const getProgress = (protocol) => {
    const total = protocol.total_sessions || protocol.duration_days || 0;
    const completed = protocol.injections_completed || 0;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
        background: '#fafafa'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '3px solid #f0f0f0', 
            borderTop: '3px solid #000', 
            borderRadius: '50%', 
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p style={{ color: '#666', fontSize: '14px' }}>Loading your dashboard...</p>
        </div>
        <style jsx>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
        padding: '24px',
        background: '#fafafa'
      }}>
        <div style={{ textAlign: 'center', maxWidth: '300px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>😕</div>
          <p style={{ color: '#666', fontSize: '15px', lineHeight: '1.5' }}>{error}</p>
          <p style={{ color: '#888', fontSize: '13px', marginTop: '16px' }}>
            Need help? Call <a href="tel:9499973988" style={{ color: '#000', fontWeight: '600' }}>(949) 997-3988</a>
          </p>
        </div>
      </div>
    );
  }

  const { patient, protocols, purchases } = data || {};
  const activeProtocols = protocols?.filter(p => p.status === 'active') || [];
  const completedProtocols = protocols?.filter(p => p.status === 'completed') || [];
  
  // Get patient name - try patient record first, then fall back to first protocol
  const patientName = patient?.first_name || 
    protocols?.[0]?.patient_name?.split(' ')[0] || 
    'Patient';
  const totalInvested = purchases?.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0) || 0;

  return (
    <>
      <Head>
        <title>My Dashboard | Range Medical</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#000000" />
      </Head>

      <div style={{ 
        minHeight: '100vh', 
        background: '#fafafa',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif'
      }}>
        {/* Header */}
        <header style={{ 
          background: 'linear-gradient(135deg, #000 0%, #1a1a1a 100%)', 
          color: 'white', 
          padding: '24px 20px'
        }}>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ fontSize: '11px', letterSpacing: '2px', opacity: 0.7, marginBottom: '8px' }}>
              RANGE MEDICAL
            </div>
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '600' }}>
              Welcome, {patientName}
            </h1>
            <p style={{ margin: '8px 0 0', fontSize: '14px', opacity: 0.8 }}>
              Your wellness journey at a glance
            </p>
          </div>
        </header>

        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px 20px' }}>
          
          {/* Quick Stats */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(2, 1fr)', 
            gap: '12px',
            marginBottom: '24px'
          }}>
            <div style={{ 
              background: 'white', 
              borderRadius: '16px', 
              padding: '20px', 
              textAlign: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}>
              <div style={{ fontSize: '32px', fontWeight: '700', color: '#16a34a' }}>
                {activeProtocols.length}
              </div>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>Active Programs</div>
            </div>
            <div style={{ 
              background: 'white', 
              borderRadius: '16px', 
              padding: '20px', 
              textAlign: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}>
              <div style={{ fontSize: '32px', fontWeight: '700', color: '#000' }}>
                {completedProtocols.length}
              </div>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>Completed</div>
            </div>
          </div>

          {/* Weight Loss Journey Dashboard */}
          {(() => {
            const hasWeightLoss = protocols?.some(p => 
              p.program_type?.includes('weight_loss') || 
              p.program_name?.toLowerCase().includes('weight loss')
            );
            
            if (!hasWeightLoss) return null;
            
            const logs = weightLogs?.logs || [];
            const stats = weightLogs?.stats || {};
            const startWeight = stats.startWeight || logs[0]?.weight;
            const currentWeight = stats.currentWeight || logs[logs.length - 1]?.weight;
            const totalLost = startWeight && currentWeight ? (startWeight - currentWeight) : 0;
            
            const milestones = [
              { lbs: 5, emoji: '🌟' },
              { lbs: 10, emoji: '⭐' },
              { lbs: 15, emoji: '🔥' },
              { lbs: 20, emoji: '💪' },
              { lbs: 25, emoji: '🏆' },
              { lbs: 30, emoji: '👑' },
              { lbs: 40, emoji: '🚀' },
              { lbs: 50, emoji: '💎' }
            ];
            const achievedMilestones = milestones.filter(m => totalLost >= m.lbs);
            const nextMilestone = milestones.find(m => totalLost < m.lbs);
            const progressToNext = nextMilestone ? Math.min(100, (totalLost / nextMilestone.lbs) * 100) : 100;
            
            return (
              <section style={{ marginBottom: '32px' }}>
                <h2 style={{ 
                  fontSize: '13px', 
                  fontWeight: '600', 
                  textTransform: 'uppercase', 
                  letterSpacing: '1px', 
                  color: '#888',
                  margin: '0 0 16px'
                }}>
                  ⚖️ Your Weight Loss Journey
                </h2>
                
                {logs.length === 0 ? (
                  <div style={{ 
                    background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)', 
                    borderRadius: '20px', 
                    padding: '32px 24px',
                    color: 'white',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚖️</div>
                    <h3 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: '600' }}>
                      Start Your Weight Journey
                    </h3>
                    <p style={{ margin: '0 0 20px', fontSize: '14px', opacity: 0.9 }}>
                      Log your first weigh-in to begin tracking your transformation
                    </p>
                    <button
                      onClick={() => setShowWeightModal(true)}
                      style={{
                        background: 'white',
                        color: '#f57c00',
                        border: 'none',
                        padding: '14px 32px',
                        borderRadius: '25px',
                        fontSize: '16px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      Log My Weight
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Main Stats Card */}
                    <div style={{ 
                      background: 'linear-gradient(135deg, #1a1a1a 0%, #333 100%)', 
                      borderRadius: '20px', 
                      padding: '24px',
                      color: 'white',
                      marginBottom: '16px'
                    }}>
                      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                        <div style={{ fontSize: '14px', opacity: 0.7, marginBottom: '4px' }}>Total Lost</div>
                        <div style={{ fontSize: '56px', fontWeight: '700', color: totalLost > 0 ? '#4ade80' : '#fff' }}>
                          {totalLost > 0 ? '-' : ''}{Math.abs(totalLost).toFixed(1)}
                          <span style={{ fontSize: '24px', marginLeft: '4px' }}>lbs</span>
                        </div>
                        {startWeight && (
                          <div style={{ fontSize: '14px', color: '#4ade80', marginTop: '4px' }}>
                            {((totalLost / startWeight) * 100).toFixed(1)}% of starting weight
                          </div>
                        )}
                      </div>
                      
                      {/* Stats Grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
                        <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '12px', padding: '14px', textAlign: 'center' }}>
                          <div style={{ fontSize: '11px', opacity: 0.7, marginBottom: '4px' }}>Started</div>
                          <div style={{ fontSize: '20px', fontWeight: '700' }}>{startWeight}</div>
                          <div style={{ fontSize: '10px', opacity: 0.5 }}>lbs</div>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '12px', padding: '14px', textAlign: 'center' }}>
                          <div style={{ fontSize: '11px', opacity: 0.7, marginBottom: '4px' }}>Current</div>
                          <div style={{ fontSize: '20px', fontWeight: '700' }}>{currentWeight}</div>
                          <div style={{ fontSize: '10px', opacity: 0.5 }}>lbs</div>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '12px', padding: '14px', textAlign: 'center' }}>
                          <div style={{ fontSize: '11px', opacity: 0.7, marginBottom: '4px' }}>Weigh-ins</div>
                          <div style={{ fontSize: '20px', fontWeight: '700' }}>{logs.length}</div>
                          <div style={{ fontSize: '10px', opacity: 0.5 }}>logged</div>
                        </div>
                      </div>
                      
                      {/* Chart */}
                      {logs.length >= 2 && (
                        <div style={{ marginBottom: '20px' }}>
                          <svg width="100%" height="100" viewBox="0 0 300 100" style={{ overflow: 'visible' }}>
                            {(() => {
                              const weights = logs.map(l => parseFloat(l.weight));
                              const max = Math.max(...weights);
                              const min = Math.min(...weights);
                              const range = max - min || 1;
                              const points = weights.map((w, i) => {
                                const x = 10 + (i / (weights.length - 1)) * 280;
                                const y = 10 + ((max - w) / range) * 80;
                                return `${x},${y}`;
                              }).join(' ');
                              const areaPoints = `10,90 ${points} 290,90`;
                              return (
                                <>
                                  <defs>
                                    <linearGradient id="portalWeightGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                                      <stop offset="0%" stopColor="#ff9800" stopOpacity="0.4" />
                                      <stop offset="100%" stopColor="#ff9800" stopOpacity="0" />
                                    </linearGradient>
                                  </defs>
                                  <polygon points={areaPoints} fill="url(#portalWeightGrad)" />
                                  <polyline points={points} fill="none" stroke="#ff9800" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                  {weights.map((w, i) => {
                                    const x = 10 + (i / (weights.length - 1)) * 280;
                                    const y = 10 + ((max - w) / range) * 80;
                                    return <circle key={i} cx={x} cy={y} r="5" fill="#ff9800" />;
                                  })}
                                </>
                              );
                            })()}
                          </svg>
                        </div>
                      )}
                      
                      {/* Log Weight Button */}
                      <button
                        onClick={() => setShowWeightModal(true)}
                        style={{
                          width: '100%',
                          background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
                          color: 'white',
                          border: 'none',
                          padding: '16px',
                          borderRadius: '12px',
                          fontSize: '16px',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        ⚖️ Log Today's Weight
                      </button>
                    </div>
                    
                    {/* Progress to Next Milestone */}
                    {nextMilestone && (
                      <div style={{ 
                        background: 'white', 
                        borderRadius: '16px', 
                        padding: '20px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                        marginBottom: '16px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <span style={{ fontSize: '15px', fontWeight: '600' }}>Next Milestone</span>
                          <span style={{ fontSize: '28px' }}>{nextMilestone.emoji}</span>
                        </div>
                        <div style={{ 
                          background: '#f0f0f0', 
                          borderRadius: '10px', 
                          height: '12px', 
                          overflow: 'hidden',
                          marginBottom: '8px'
                        }}>
                          <div style={{ 
                            width: `${progressToNext}%`, 
                            height: '100%', 
                            background: 'linear-gradient(90deg, #ff9800 0%, #f57c00 100%)',
                            borderRadius: '10px',
                            transition: 'width 0.5s ease'
                          }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#888' }}>
                          <span>{totalLost.toFixed(1)} lbs lost</span>
                          <span>{nextMilestone.lbs} lbs goal</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Achieved Milestones */}
                    {achievedMilestones.length > 0 && (
                      <div style={{ 
                        background: 'white', 
                        borderRadius: '16px', 
                        padding: '20px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                        marginBottom: '16px'
                      }}>
                        <div style={{ fontSize: '15px', fontWeight: '600', marginBottom: '12px' }}>
                          🏅 Milestones Achieved
                        </div>
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                          {achievedMilestones.map((m, i) => (
                            <div key={i} style={{
                              background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                              padding: '10px 16px',
                              borderRadius: '20px',
                              fontSize: '14px',
                              fontWeight: '500',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}>
                              {m.emoji} {m.lbs} lbs
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Recent Weigh-ins */}
                    <div style={{ 
                      background: 'white', 
                      borderRadius: '16px', 
                      padding: '20px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                    }}>
                      <div style={{ fontSize: '15px', fontWeight: '600', marginBottom: '16px' }}>
                        📊 Recent Weigh-ins
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {logs.slice(-5).reverse().map((log, i, arr) => {
                          const prevLog = arr[i + 1];
                          const change = prevLog ? (parseFloat(log.weight) - parseFloat(prevLog.weight)).toFixed(1) : null;
                          return (
                            <div key={i} style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '12px 16px',
                              background: '#fafafa',
                              borderRadius: '12px'
                            }}>
                              <div>
                                <div style={{ fontSize: '16px', fontWeight: '600' }}>{log.weight} lbs</div>
                                <div style={{ fontSize: '12px', color: '#888' }}>
                                  {new Date(log.log_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                </div>
                              </div>
                              {change !== null && (
                                <span style={{
                                  fontSize: '14px',
                                  fontWeight: '600',
                                  color: change < 0 ? '#16a34a' : change > 0 ? '#dc2626' : '#888',
                                  background: change < 0 ? '#dcfce7' : change > 0 ? '#fee2e2' : '#f5f5f5',
                                  padding: '6px 12px',
                                  borderRadius: '20px'
                                }}>
                                  {change > 0 ? '+' : ''}{change} lbs
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </section>
            );
          })()}

          {/* Active Programs */}
          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ 
              fontSize: '13px', 
              fontWeight: '600', 
              textTransform: 'uppercase', 
              letterSpacing: '1px', 
              color: '#888',
              margin: '0 0 16px'
            }}>
              Your Active Programs
            </h2>
            
            {activeProtocols.length === 0 ? (
              <div style={{ 
                background: 'white', 
                borderRadius: '16px', 
                padding: '40px 20px', 
                textAlign: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
              }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>🌟</div>
                <p style={{ color: '#666', fontSize: '15px', margin: 0 }}>
                  No active programs. Ready to start your next protocol?
                </p>
                <a 
                  href="tel:9499973988"
                  style={{ 
                    display: 'inline-block',
                    marginTop: '16px',
                    padding: '12px 24px',
                    background: '#000',
                    color: 'white',
                    borderRadius: '25px',
                    textDecoration: 'none',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  Contact Us
                </a>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {activeProtocols.map(protocol => {
                  const progress = getProgress(protocol);
                  const daysLeft = getDaysRemaining(protocol.end_date);
                  const isEnding = daysLeft !== null && daysLeft <= 7 && daysLeft > 0;
                  
                  return (
                    <div key={protocol.id} style={{ 
                      background: 'white', 
                      borderRadius: '16px', 
                      overflow: 'hidden',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                    }}>
                      {/* Progress Bar */}
                      <div style={{ height: '4px', background: '#f0f0f0' }}>
                        <div style={{ 
                          height: '100%', 
                          width: `${progress}%`, 
                          background: 'linear-gradient(90deg, #000 0%, #333 100%)',
                          transition: 'width 0.5s ease'
                        }} />
                      </div>
                      
                      <div style={{ padding: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: '600' }}>
                              {protocol.program_name || protocol.program_type}
                            </h3>
                            {protocol.primary_peptide && (
                              <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                                {protocol.primary_peptide}
                                {protocol.secondary_peptide && ` + ${protocol.secondary_peptide}`}
                              </p>
                            )}
                          </div>
                          <div style={{ 
                            background: isEnding ? '#fef3c7' : '#f0fdf4',
                            color: isEnding ? '#92400e' : '#166534',
                            padding: '6px 12px',
                            borderRadius: '20px',
                            fontSize: '13px',
                            fontWeight: '600'
                          }}>
                            {progress}% Complete
                          </div>
                        </div>
                        
                        <div style={{ 
                          display: 'flex', 
                          gap: '20px', 
                          marginTop: '16px',
                          paddingTop: '16px',
                          borderTop: '1px solid #f0f0f0'
                        }}>
                          <div>
                            <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Started</div>
                            <div style={{ fontSize: '14px', fontWeight: '500', marginTop: '2px' }}>{formatDate(protocol.start_date)}</div>
                          </div>
                          {protocol.end_date && (
                            <div>
                              <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ends</div>
                              <div style={{ fontSize: '14px', fontWeight: '500', marginTop: '2px' }}>{formatDate(protocol.end_date)}</div>
                            </div>
                          )}
                          {daysLeft !== null && (
                            <div>
                              <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Remaining</div>
                              <div style={{ fontSize: '14px', fontWeight: '500', marginTop: '2px', color: isEnding ? '#f59e0b' : '#000' }}>
                                {daysLeft > 0 ? `${daysLeft} days` : 'Completed!'}
                              </div>
                            </div>
                          )}
                          {protocol.dose_frequency && (
                            <div>
                              <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Schedule</div>
                              <div style={{ fontSize: '14px', fontWeight: '500', marginTop: '2px' }}>{protocol.dose_frequency}</div>
                            </div>
                          )}
                        </div>
                        
                        {/* Action Button */}
                        {protocol.access_token && (
                          <a 
                            href={`/track/${protocol.access_token}`}
                            style={{ 
                              display: 'block',
                              marginTop: '16px',
                              padding: '14px',
                              background: 'linear-gradient(135deg, #000 0%, #333 100%)',
                              color: 'white',
                              borderRadius: '12px',
                              textDecoration: 'none',
                              textAlign: 'center',
                              fontSize: '14px',
                              fontWeight: '600'
                            }}
                          >
                            {protocol.program_type?.includes('weight_loss') || protocol.program_name?.toLowerCase().includes('weight loss')
                              ? 'Log Injection →'
                              : 'Open Tracker →'}
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Purchase History */}
          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ 
              fontSize: '13px', 
              fontWeight: '600', 
              textTransform: 'uppercase', 
              letterSpacing: '1px', 
              color: '#888',
              margin: '0 0 16px'
            }}>
              Your History
            </h2>
            
            <div style={{ 
              background: 'white', 
              borderRadius: '16px', 
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}>
              {!purchases?.length ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: '#666' }}>
                  No history yet
                </div>
              ) : (
                <>
                  {/* Summary Header */}
                  <div style={{ 
                    padding: '16px 20px', 
                    background: '#f8f8f8',
                    borderBottom: '1px solid #f0f0f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ fontSize: '14px', color: '#666' }}>
                      {purchases.length} transaction{purchases.length !== 1 ? 's' : ''}
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: '600' }}>
                      Total: {formatCurrency(totalInvested)}
                    </span>
                  </div>
                  
                  {/* Transaction List */}
                  <div>
                    {purchases.slice(0, 10).map((purchase, idx) => (
                      <div 
                        key={purchase.id}
                        style={{ 
                          padding: '16px 20px',
                          borderBottom: idx < purchases.length - 1 ? '1px solid #f5f5f5' : 'none',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: '500', fontSize: '14px', color: '#333' }}>
                            {purchase.item_name}
                          </div>
                          <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>
                            {formatDate(purchase.purchase_date)}
                            {purchase.quantity > 1 && ` • Qty: ${purchase.quantity}`}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: '600', fontSize: '14px' }}>
                            {formatCurrency(purchase.amount)}
                          </div>
                          {purchase.protocol_id && (
                            <div style={{ 
                              fontSize: '10px', 
                              color: '#16a34a',
                              marginTop: '2px'
                            }}>
                              ✓ Active
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {purchases.length > 10 && (
                    <div style={{ 
                      padding: '12px 20px', 
                      textAlign: 'center', 
                      background: '#f8f8f8',
                      fontSize: '13px',
                      color: '#666'
                    }}>
                      + {purchases.length - 10} more transactions
                    </div>
                  )}
                </>
              )}
            </div>
          </section>

          {/* Completed Programs */}
          {completedProtocols.length > 0 && (
            <section style={{ marginBottom: '32px' }}>
              <h2 style={{ 
                fontSize: '13px', 
                fontWeight: '600', 
                textTransform: 'uppercase', 
                letterSpacing: '1px', 
                color: '#888',
                margin: '0 0 16px'
              }}>
                Completed Programs
              </h2>
              
              <div style={{ 
                background: 'white', 
                borderRadius: '16px', 
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
              }}>
                {completedProtocols.map((protocol, idx) => (
                  <div 
                    key={protocol.id}
                    style={{ 
                      padding: '16px 20px',
                      borderBottom: idx < completedProtocols.length - 1 ? '1px solid #f5f5f5' : 'none',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '500', fontSize: '14px' }}>
                        {protocol.program_name || protocol.program_type}
                      </div>
                      {protocol.primary_peptide && (
                        <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                          {protocol.primary_peptide}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ 
                        background: '#f0fdf4', 
                        color: '#166534',
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        ✓ Complete
                      </div>
                      <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>
                        {formatDate(protocol.end_date)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Contact Card */}
          <section>
            <div style={{ 
              background: 'linear-gradient(135deg, #1a1a1a 0%, #333 100%)', 
              borderRadius: '16px', 
              padding: '24px',
              color: 'white',
              textAlign: 'center'
            }}>
              <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: '600' }}>
                Questions?
              </h3>
              <p style={{ margin: '0 0 16px', fontSize: '14px', opacity: 0.8 }}>
                We're here to help with your wellness journey
              </p>
              <a 
                href="tel:9499973988"
                style={{ 
                  display: 'inline-block',
                  padding: '12px 32px',
                  background: 'white',
                  color: '#000',
                  borderRadius: '25px',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                📞 (949) 997-3988
              </a>
            </div>
          </section>
        </div>

        {/* Footer */}
        <footer style={{ 
          textAlign: 'center', 
          padding: '32px 20px',
          borderTop: '1px solid #e5e5e5',
          background: 'white',
          marginTop: '24px'
        }}>
          <div style={{ fontSize: '11px', color: '#ccc', letterSpacing: '2px' }}>RANGE MEDICAL</div>
          <div style={{ fontSize: '11px', color: '#bbb', marginTop: '4px' }}>Newport Beach, CA</div>
        </footer>

        {/* Weight Logging Modal */}
        {showWeightModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }} onClick={() => setShowWeightModal(false)}>
            <div style={{
              background: 'white',
              borderRadius: '24px',
              width: '100%',
              maxWidth: '360px',
              overflow: 'hidden'
            }} onClick={e => e.stopPropagation()}>
              <div style={{ 
                background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)', 
                padding: '28px 24px', 
                color: 'white',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚖️</div>
                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>Log Your Weight</h3>
                <p style={{ margin: '8px 0 0', fontSize: '14px', opacity: 0.9 }}>
                  Track your progress
                </p>
              </div>
              
              <div style={{ padding: '28px 24px' }}>
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '10px', color: '#333' }}>
                    Today's Weight
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number"
                      step="0.1"
                      value={newWeight}
                      onChange={(e) => setNewWeight(e.target.value)}
                      placeholder="Enter weight"
                      style={{
                        width: '100%',
                        padding: '18px 60px 18px 20px',
                        border: '2px solid #e5e5e5',
                        borderRadius: '14px',
                        fontSize: '24px',
                        fontWeight: '700',
                        textAlign: 'center',
                        boxSizing: 'border-box',
                        outline: 'none'
                      }}
                      autoFocus
                    />
                    <span style={{
                      position: 'absolute',
                      right: '20px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: '18px',
                      color: '#888',
                      fontWeight: '500'
                    }}>lbs</span>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => setShowWeightModal(false)}
                    style={{
                      flex: 1,
                      padding: '16px',
                      border: '1px solid #e5e5e5',
                      borderRadius: '12px',
                      background: 'white',
                      fontSize: '15px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      color: '#666'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveWeight}
                    disabled={!newWeight || savingWeight}
                    style={{
                      flex: 1,
                      padding: '16px',
                      border: 'none',
                      borderRadius: '12px',
                      background: newWeight ? 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)' : '#e5e5e5',
                      color: newWeight ? 'white' : '#999',
                      fontSize: '15px',
                      fontWeight: '600',
                      cursor: newWeight ? 'pointer' : 'not-allowed'
                    }}
                  >
                    {savingWeight ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
