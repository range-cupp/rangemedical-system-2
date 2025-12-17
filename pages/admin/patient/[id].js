// /pages/admin/patient/[id].js
// Patient Profile Page
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
  
  // Patient data
  const [patient, setPatient] = useState(null);
  const [protocols, setProtocols] = useState([]);
  const [purchases, setPurchases] = useState([]);

  // Check auth on mount
  useEffect(() => {
    const stored = localStorage.getItem('adminPassword');
    if (stored) {
      setPassword(stored);
      setIsAuthenticated(true);
    } else {
      setLoading(false);
    }
  }, []);

  // Fetch patient data when authenticated and ID available
  useEffect(() => {
    if (isAuthenticated && id) {
      fetchPatientData();
    }
  }, [isAuthenticated, id]);

  const fetchPatientData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch(`/api/admin/patient/${id}`, {
        headers: { 'Authorization': `Bearer ${password}` }
      });
      
      if (!res.ok) {
        throw new Error('Failed to fetch patient data');
      }
      
      const data = await res.json();
      setPatient(data.patient);
      setProtocols(data.protocols || []);
      setPurchases(data.purchases || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#4caf50';
      case 'completed': return '#2196f3';
      case 'paused': return '#ff9800';
      case 'cancelled': return '#f44336';
      default: return '#666';
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Peptide': '#4caf50',
      'Weight Loss': '#ff9800',
      'HRT': '#1565c0',
      'IV Therapy': '#9c27b0',
      'Injection': '#e91e63',
      'Labs': '#00bcd4',
      'Hyperbaric': '#795548',
      'Red Light': '#ff5722',
      'Consultation': '#607d8b',
      'Product': '#9e9e9e'
    };
    return colors[category] || '#666';
  };

  // Login screen
  if (!isAuthenticated) {
    return (
      <>
        <Head>
          <title>Admin Login | Range Medical</title>
        </Head>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f5f5f5',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}>
          <div style={{ textAlign: 'center' }}>
            <p>Please log in through the <Link href="/admin/dashboard" style={{ color: '#1976d2' }}>dashboard</Link></p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{patient?.name || 'Patient'} | Range Medical</title>
      </Head>
      <div style={{
        minHeight: '100vh',
        background: '#f5f5f5',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        {/* Header */}
        <header style={{
          background: 'black',
          color: 'white',
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '600' }}>RANGE MEDICAL</h1>
            <p style={{ margin: '4px 0 0', fontSize: '14px', opacity: 0.8 }}>Patient Profile</p>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('adminPassword');
              setIsAuthenticated(false);
            }}
            style={{
              padding: '8px 16px',
              background: 'transparent',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Logout
          </button>
        </header>

        {/* Navigation */}
        <nav style={{
          background: 'white',
          borderBottom: '1px solid #e0e0e0',
          padding: '0 24px',
          display: 'flex',
          gap: '0'
        }}>
          {[
            { href: '/admin/dashboard', label: 'Dashboard' },
            { href: '/admin/protocols', label: 'Protocols' },
            { href: '/admin/purchases', label: 'Purchases' },
            { href: '/admin/patients', label: 'Patients', active: true }
          ].map(item => (
            <Link key={item.href} href={item.href} style={{
              padding: '16px 20px',
              color: item.active ? 'black' : '#666',
              textDecoration: 'none',
              borderBottom: item.active ? '2px solid black' : '2px solid transparent',
              fontWeight: item.active ? '500' : '400',
              fontSize: '14px'
            }}>
              {item.label}
            </Link>
          ))}
        </nav>

        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#666' }}>
            Loading patient data...
          </div>
        ) : error ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#c62828' }}>
            {error}
          </div>
        ) : patient ? (
          <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
            
            {/* Back link */}
            <Link href="/admin/patients" style={{
              color: '#666',
              textDecoration: 'none',
              fontSize: '14px',
              display: 'inline-block',
              marginBottom: '16px'
            }}>
              ← Back to Patients
            </Link>

            {/* Patient Info Card */}
            <div style={{
              background: 'white',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              padding: '24px',
              marginBottom: '24px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h2 style={{ margin: '0 0 8px', fontSize: '28px', fontWeight: '600' }}>
                    {patient.name}
                  </h2>
                  <div style={{ display: 'flex', gap: '24px', color: '#666', fontSize: '14px' }}>
                    {patient.email && (
                      <span>📧 {patient.email}</span>
                    )}
                    {patient.phone && (
                      <span>📱 {patient.phone}</span>
                    )}
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
              <div style={{
                display: 'flex',
                gap: '24px',
                marginTop: '20px',
                paddingTop: '20px',
                borderTop: '1px solid #eee'
              }}>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: '600' }}>{protocols.length}</div>
                  <div style={{ fontSize: '13px', color: '#666' }}>Total Protocols</div>
                </div>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: '600', color: '#4caf50' }}>
                    {protocols.filter(p => p.status === 'active').length}
                  </div>
                  <div style={{ fontSize: '13px', color: '#666' }}>Active</div>
                </div>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: '600', color: '#2196f3' }}>
                    {protocols.filter(p => p.status === 'completed').length}
                  </div>
                  <div style={{ fontSize: '13px', color: '#666' }}>Completed</div>
                </div>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: '600' }}>{purchases.length}</div>
                  <div style={{ fontSize: '13px', color: '#666' }}>Purchases</div>
                </div>
              </div>
            </div>

            {/* Two Column Layout */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
              gap: '24px'
            }}>
              
              {/* Protocols Section */}
              <div style={{
                background: 'white',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                overflow: 'hidden'
              }}>
                <div style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid #e0e0e0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Protocols</h3>
                  <span style={{ fontSize: '13px', color: '#666' }}>{protocols.length} total</span>
                </div>
                
                {protocols.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                    No protocols found
                  </div>
                ) : (
                  <div style={{ maxHeight: '400px', overflow: 'auto' }}>
                    {protocols.map(protocol => {
                      const today = new Date();
                      const endDate = new Date(protocol.end_date);
                      const daysLeft = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
                      
                      return (
                        <div key={protocol.id} style={{
                          padding: '14px 20px',
                          borderBottom: '1px solid #f0f0f0',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <div>
                            <div style={{ fontWeight: '500', fontSize: '14px' }}>
                              {protocol.program_name}
                            </div>
                            <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                              {formatDate(protocol.start_date)} - {formatDate(protocol.end_date)}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '3px 10px',
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontWeight: '500',
                              background: `${getStatusColor(protocol.status)}15`,
                              color: getStatusColor(protocol.status)
                            }}>
                              {protocol.status}
                            </span>
                            {protocol.status === 'active' && (
                              <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                                {daysLeft > 0 ? `${daysLeft}d left` : 'Ending today'}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Purchases Section */}
              <div style={{
                background: 'white',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                overflow: 'hidden'
              }}>
                <div style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid #e0e0e0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Purchase History</h3>
                  <span style={{ fontSize: '13px', color: '#666' }}>{purchases.length} total</span>
                </div>
                
                {purchases.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                    No purchases found
                  </div>
                ) : (
                  <div style={{ maxHeight: '400px', overflow: 'auto' }}>
                    {purchases.map(purchase => (
                      <div key={purchase.id} style={{
                        padding: '14px 20px',
                        borderBottom: '1px solid #f0f0f0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div>
                          <div style={{ fontWeight: '500', fontSize: '14px' }}>
                            {purchase.item_name}
                          </div>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '10px',
                              fontWeight: '500',
                              background: `${getCategoryColor(purchase.category)}15`,
                              color: getCategoryColor(purchase.category)
                            }}>
                              {purchase.category}
                            </span>
                            <span style={{ fontSize: '12px', color: '#666' }}>
                              {formatDate(purchase.purchase_date)}
                            </span>
                          </div>
                        </div>
                        <div style={{ fontWeight: '600', fontSize: '14px' }}>
                          {formatCurrency(purchase.amount)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ padding: '60px', textAlign: 'center', color: '#666' }}>
            Patient not found
          </div>
        )}
      </div>
    </>
  );
}
