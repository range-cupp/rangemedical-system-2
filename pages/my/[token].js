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
      } else {
        setError('Unable to load your information. Please check your link.');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    }
    setLoading(false);
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
              Welcome, {patient?.first_name || 'Patient'}
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
            gridTemplateColumns: 'repeat(3, 1fr)', 
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
            <div style={{ 
              background: 'white', 
              borderRadius: '16px', 
              padding: '20px', 
              textAlign: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}>
              <div style={{ fontSize: '32px', fontWeight: '700', color: '#000' }}>
                {purchases?.length || 0}
              </div>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>Total Visits</div>
            </div>
          </div>

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
                            Open Tracker →
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
      </div>
    </>
  );
}
