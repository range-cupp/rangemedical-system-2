// /pages/admin/dashboard.js
// Range Medical - Unified Admin Dashboard
// Clinic Homebase for all patient management

import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Dashboard data
  const [stats, setStats] = useState({
    totalProtocols: 0,
    activeProtocols: 0,
    completedProtocols: 0,
    totalPurchases: 0,
    recentPurchases: 0,
    totalPatients: 0,
    totalRevenue: 0
  });
  const [recentProtocols, setRecentProtocols] = useState([]);
  const [recentPurchases, setRecentPurchases] = useState([]);
  const [activeProtocols, setActiveProtocols] = useState([]);

  // Check stored password on mount
  useEffect(() => {
    const stored = localStorage.getItem('adminPassword');
    if (stored) {
      setPassword(stored);
      setIsAuthenticated(true);
    } else {
      setLoading(false);
    }
  }, []);

  // Fetch dashboard data
  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardData();
    }
  }, [isAuthenticated]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/dashboard-stats', {
        headers: { 'Authorization': `Bearer ${password}` }
      });
      
      if (!res.ok) throw new Error('Failed to fetch dashboard data');
      
      const data = await res.json();
      setStats(data.stats || {});
      setRecentProtocols(data.recentProtocols || []);
      setRecentPurchases(data.recentPurchases || []);
      setActiveProtocols(data.activeProtocols || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/admin/dashboard-stats', {
        headers: { 'Authorization': `Bearer ${password}` }
      });
      
      if (res.ok) {
        setIsAuthenticated(true);
        localStorage.setItem('adminPassword', password);
      } else {
        setError('Invalid password');
        setLoading(false);
      }
    } catch (err) {
      setError('Connection error');
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount || 0);
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
          <form onSubmit={handleLogin} style={{
            background: 'white',
            padding: '40px',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            width: '100%',
            maxWidth: '400px'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <h1 style={{ margin: '0 0 8px', fontSize: '28px', fontWeight: '600' }}>
                RANGE MEDICAL
              </h1>
              <p style={{ margin: 0, color: '#666' }}>Admin Dashboard</p>
            </div>
            
            {error && (
              <div style={{
                background: '#ffebee',
                color: '#c62828',
                padding: '12px',
                borderRadius: '4px',
                marginBottom: '16px',
                fontSize: '14px'
              }}>
                {error}
              </div>
            )}
            
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '16px',
                marginBottom: '16px',
                boxSizing: 'border-box'
              }}
            />
            
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                background: 'black',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '16px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </>
    );
  }

  // Main dashboard
  return (
    <>
      <Head>
        <title>Admin Dashboard | Range Medical</title>
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
            <p style={{ margin: '4px 0 0', fontSize: '14px', opacity: 0.8 }}>Admin Dashboard</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={fetchDashboardData}
              style={{
                padding: '8px 16px',
                background: 'rgba(255,255,255,0.1)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Refresh
            </button>
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
          </div>
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
            { href: '/admin/dashboard', label: 'Dashboard', active: true },
            { href: '/admin/protocols', label: 'Protocols' },
            { href: '/admin/purchases', label: 'Purchases' },
            { href: '/admin/patients', label: 'Patients' }
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
            Loading dashboard...
          </div>
        ) : (
          <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
            {/* Stats Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              marginBottom: '24px'
            }}>
              <StatCard 
                label="Active Protocols" 
                value={stats.activeProtocols} 
                color="#4caf50"
                href="/admin/protocols?status=active"
              />
              <StatCard 
                label="Total Protocols" 
                value={stats.totalProtocols} 
                color="#2196f3"
                href="/admin/protocols"
              />
              <StatCard 
                label="Purchases (30 days)" 
                value={stats.recentPurchases} 
                color="#ff9800"
                href="/admin/purchases"
              />
              <StatCard 
                label="Revenue (30 days)" 
                value={formatCurrency(stats.totalRevenue)} 
                color="#9c27b0"
                isText
              />
            </div>

            {/* Quick Actions */}
            <div style={{
              background: 'white',
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <h2 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '600' }}>Quick Actions</h2>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <Link href="/admin/protocols" style={{
                  padding: '12px 20px',
                  background: 'black',
                  color: 'white',
                  borderRadius: '4px',
                  textDecoration: 'none',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  + New Protocol
                </Link>
                <Link href="/admin/protocols?status=active" style={{
                  padding: '12px 20px',
                  background: '#e8f5e9',
                  color: '#2e7d32',
                  borderRadius: '4px',
                  textDecoration: 'none',
                  fontSize: '14px'
                }}>
                  View Active Protocols
                </Link>
                <Link href="/admin/purchases" style={{
                  padding: '12px 20px',
                  background: '#e3f2fd',
                  color: '#1565c0',
                  borderRadius: '4px',
                  textDecoration: 'none',
                  fontSize: '14px'
                }}>
                  View Purchases
                </Link>
              </div>
            </div>

            {/* Two Column Layout */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
              gap: '24px'
            }}>
              {/* Active Protocols */}
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
                  <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Active Protocols</h2>
                  <Link href="/admin/protocols?status=active" style={{
                    fontSize: '13px',
                    color: '#1976d2',
                    textDecoration: 'none'
                  }}>
                    View All →
                  </Link>
                </div>
                <div style={{ maxHeight: '400px', overflow: 'auto' }}>
                  {activeProtocols.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                      No active protocols
                    </div>
                  ) : (
                    activeProtocols.map(protocol => (
                      <div key={protocol.id} style={{
                        padding: '12px 20px',
                        borderBottom: '1px solid #f0f0f0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div>
                          <div style={{ fontWeight: '500', fontSize: '14px' }}>
                            {protocol.patient_name}
                          </div>
                          <div style={{ fontSize: '12px', color: '#666' }}>
                            {protocol.program_name}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '12px', color: '#666' }}>
                            Day {protocol.injections_completed || 0}/{protocol.duration_days}
                          </div>
                          <div style={{ fontSize: '11px', color: '#999' }}>
                            Ends {formatDate(protocol.end_date)}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Recent Purchases */}
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
                  <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Recent Purchases</h2>
                  <Link href="/admin/purchases" style={{
                    fontSize: '13px',
                    color: '#1976d2',
                    textDecoration: 'none'
                  }}>
                    View All →
                  </Link>
                </div>
                <div style={{ maxHeight: '400px', overflow: 'auto' }}>
                  {recentPurchases.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                      No recent purchases
                    </div>
                  ) : (
                    recentPurchases.map(purchase => (
                      <div key={purchase.id} style={{
                        padding: '12px 20px',
                        borderBottom: '1px solid #f0f0f0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div>
                          <div style={{ fontWeight: '500', fontSize: '14px' }}>
                            {purchase.patient_name}
                          </div>
                          <div style={{ fontSize: '12px', color: '#666' }}>
                            {purchase.item_name}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: '500', fontSize: '14px' }}>
                            {formatCurrency(purchase.amount)}
                          </div>
                          <div style={{ fontSize: '11px', color: '#999' }}>
                            {formatDate(purchase.purchase_date)}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Category Breakdown */}
            <div style={{
              background: 'white',
              borderRadius: '8px',
              padding: '20px',
              marginTop: '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <h2 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '600' }}>
                Protocol Types Overview
              </h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '12px'
              }}>
                {[
                  { type: 'recovery_10day', label: 'Recovery (10-Day)', color: '#4caf50' },
                  { type: 'jumpstart_10day', label: 'Jumpstart (10-Day)', color: '#2196f3' },
                  { type: 'month_30day', label: 'Month (30-Day)', color: '#ff9800' },
                  { type: 'injection_clinic', label: 'In-Clinic', color: '#9c27b0' }
                ].map(item => {
                  const count = activeProtocols.filter(p => p.program_type === item.type).length;
                  return (
                    <div key={item.type} style={{
                      padding: '16px',
                      background: '#f5f5f5',
                      borderRadius: '8px',
                      borderLeft: `4px solid ${item.color}`
                    }}>
                      <div style={{ fontSize: '24px', fontWeight: '600' }}>{count}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>{item.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// Stat Card Component
function StatCard({ label, value, color, href, isText }) {
  const content = (
    <div style={{
      background: 'white',
      borderRadius: '8px',
      padding: '20px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      borderLeft: `4px solid ${color}`,
      cursor: href ? 'pointer' : 'default',
      transition: 'transform 0.1s',
    }}>
      <div style={{ 
        fontSize: isText ? '24px' : '32px', 
        fontWeight: '600',
        marginBottom: '4px'
      }}>
        {value}
      </div>
      <div style={{ fontSize: '14px', color: '#666' }}>{label}</div>
    </div>
  );

  if (href) {
    return <Link href={href} style={{ textDecoration: 'none', color: 'inherit' }}>{content}</Link>;
  }
  return content;
}
