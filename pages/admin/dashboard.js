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
  const [stats, setStats] = useState({});
  const [activePeptideProtocols, setActivePeptideProtocols] = useState([]);
  const [activeWeightLossProtocols, setActiveWeightLossProtocols] = useState([]);
  const [recentPurchases, setRecentPurchases] = useState([]);
  const [hrtMembers, setHrtMembers] = useState([]);
  const [recentIV, setRecentIV] = useState([]);
  const [recentInjections, setRecentInjections] = useState([]);

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
      setActivePeptideProtocols(data.activePeptideProtocols || []);
      setActiveWeightLossProtocols(data.activeWeightLossProtocols || []);
      setRecentPurchases(data.recentPurchases || []);
      setHrtMembers(data.hrtMembers || []);
      setRecentIV(data.recentIV || []);
      setRecentInjections(data.recentInjections || []);
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
            
            {/* Revenue Overview Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '16px',
              marginBottom: '24px'
            }}>
              <StatCard 
                label="Total Revenue (30d)" 
                value={formatCurrency(stats.totalRevenue)} 
                color="#2e7d32"
                isText
              />
              <StatCard 
                label="HRT" 
                value={formatCurrency(stats.hrt?.revenue)} 
                subtext={`${stats.hrt?.members || 0} members`}
                color="#1565c0"
                isText
              />
              <StatCard 
                label="Peptides" 
                value={formatCurrency(stats.peptides?.revenue)} 
                subtext={`${stats.peptides?.activeProtocols || 0} active`}
                color="#4caf50"
                isText
              />
              <StatCard 
                label="Weight Loss" 
                value={formatCurrency(stats.weightLoss?.revenue)} 
                subtext={`${stats.weightLoss?.activeProtocols || 0} active`}
                color="#ff9800"
                isText
              />
              <StatCard 
                label="IV Therapy" 
                value={formatCurrency(stats.ivTherapy?.revenue)} 
                subtext={`${stats.ivTherapy?.sessions || 0} sessions`}
                color="#9c27b0"
                isText
              />
              <StatCard 
                label="Injections" 
                value={formatCurrency(stats.injections?.revenue)} 
                subtext={`${stats.injections?.count || 0} this month`}
                color="#e91e63"
                isText
              />
            </div>

            {/* Service Sections - 2x2 Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
              gap: '24px',
              marginBottom: '24px'
            }}>
              
              {/* Peptide Protocols - Ending Soonest */}
              <ServiceCard
                title="Peptide Protocols"
                subtitle={`${activePeptideProtocols.length} active`}
                color="#4caf50"
                linkText="View All"
                linkHref="/admin/protocols?status=active"
                emptyText="No active peptide protocols"
                items={activePeptideProtocols}
                renderItem={(protocol) => {
                  const today = new Date();
                  const endDate = new Date(protocol.end_date);
                  const daysLeft = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
                  const isEndingSoon = daysLeft <= 3;
                  const isOverdue = daysLeft < 0;
                  
                  return (
                    <div key={protocol.id} style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid #f0f0f0',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: isOverdue ? '#fff5f5' : isEndingSoon ? '#fffbf0' : 'white'
                    }}>
                      <div>
                        <div style={{ fontWeight: '500', fontSize: '14px' }}>{protocol.patient_name}</div>
                        <div style={{ fontSize: '12px', color: '#666' }}>{protocol.program_name}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ 
                          fontSize: '12px', 
                          fontWeight: '600',
                          color: isOverdue ? '#c62828' : isEndingSoon ? '#ef6c00' : '#666'
                        }}>
                          {isOverdue ? `${Math.abs(daysLeft)}d overdue` : 
                           daysLeft === 0 ? 'Ends today' :
                           `${daysLeft}d left`}
                        </div>
                        <div style={{ fontSize: '11px', color: '#999' }}>
                          {protocol.injections_completed || 0}/{protocol.duration_days}
                        </div>
                      </div>
                    </div>
                  );
                }}
              />

              {/* Weight Loss Protocols - Separate from Peptides */}
              <ServiceCard
                title="Weight Loss Programs"
                subtitle={`${activeWeightLossProtocols.length} active`}
                color="#ff9800"
                linkText="View All"
                linkHref="/admin/purchases?category=Weight+Loss"
                emptyText="No active weight loss programs"
                items={activeWeightLossProtocols}
                renderItem={(protocol) => {
                  const today = new Date();
                  const endDate = new Date(protocol.end_date);
                  const daysLeft = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
                  const isEndingSoon = daysLeft <= 3;
                  const isOverdue = daysLeft < 0;
                  
                  return (
                    <div key={protocol.id} style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid #f0f0f0',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: isOverdue ? '#fff5f5' : isEndingSoon ? '#fffbf0' : 'white'
                    }}>
                      <div>
                        <div style={{ fontWeight: '500', fontSize: '14px' }}>{protocol.patient_name}</div>
                        <div style={{ fontSize: '12px', color: '#666' }}>{protocol.program_name}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ 
                          fontSize: '12px', 
                          fontWeight: '600',
                          color: isOverdue ? '#c62828' : isEndingSoon ? '#ef6c00' : '#666'
                        }}>
                          {isOverdue ? `${Math.abs(daysLeft)}d overdue` : 
                           daysLeft === 0 ? 'Ends today' :
                           `${daysLeft}d left`}
                        </div>
                        <div style={{ fontSize: '11px', color: '#999' }}>
                          {protocol.injections_completed || 0}/{protocol.duration_days}
                        </div>
                      </div>
                    </div>
                  );
                }}
              />

              {/* HRT Members */}
              <ServiceCard
                title="HRT Members"
                subtitle={`${stats.hrt?.members || 0} total`}
                color="#1565c0"
                linkText="View Purchases"
                linkHref="/admin/purchases?category=HRT"
                emptyText="No HRT members"
                items={hrtMembers}
                renderItem={(member) => (
                  <div key={member.ghl_contact_id} style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #f0f0f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontWeight: '500', fontSize: '14px' }}>{member.patient_name}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>{member.patient_email || member.patient_phone || '-'}</div>
                    </div>
                    <Link href={`/admin/purchases?search=${encodeURIComponent(member.patient_name)}`} style={{
                      fontSize: '12px',
                      color: '#1565c0',
                      textDecoration: 'none'
                    }}>
                      History →
                    </Link>
                  </div>
                )}
              />

              {/* IV Therapy */}
              <ServiceCard
                title="IV Therapy"
                subtitle="recent sessions"
                color="#9c27b0"
                linkText="View All"
                linkHref="/admin/purchases?category=IV+Therapy"
                emptyText="No recent IV sessions"
                items={recentIV}
                renderItem={(item) => (
                  <div key={item.id} style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #f0f0f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontWeight: '500', fontSize: '14px' }}>{item.patient_name}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>{item.item_name}</div>
                    </div>
                    <div style={{ fontSize: '12px', color: '#999' }}>
                      {formatDate(item.purchase_date)}
                    </div>
                  </div>
                )}
              />

              {/* Injections */}
              <ServiceCard
                title="Injections"
                subtitle="recent in-clinic"
                color="#e91e63"
                linkText="View All"
                linkHref="/admin/purchases?category=Injection"
                emptyText="No recent injections"
                items={recentInjections}
                renderItem={(item) => (
                  <div key={item.id} style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #f0f0f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontWeight: '500', fontSize: '14px' }}>{item.patient_name}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>{item.item_name}</div>
                    </div>
                    <div style={{ fontSize: '12px', color: '#999' }}>
                      {formatDate(item.purchase_date)}
                    </div>
                  </div>
                )}
              />

              {/* Recent Purchases */}
              <ServiceCard
                title="Recent Purchases"
                subtitle="all categories"
                color="#607d8b"
                linkText="View All"
                linkHref="/admin/purchases"
                emptyText="No recent purchases"
                items={recentPurchases.slice(0, 10)}
                renderItem={(purchase) => (
                  <div key={purchase.id} style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #f0f0f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '500', fontSize: '14px' }}>{purchase.patient_name}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>{purchase.item_name}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: '500', fontSize: '14px' }}>{formatCurrency(purchase.amount)}</div>
                      <div style={{ fontSize: '11px', color: '#999' }}>{purchase.category}</div>
                    </div>
                  </div>
                )}
              />
            </div>

            {/* Quick Actions */}
            <div style={{
              background: 'white',
              borderRadius: '8px',
              padding: '20px',
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
                  fontSize: '14px'
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
                  Active Protocols
                </Link>
                <Link href="/admin/purchases" style={{
                  padding: '12px 20px',
                  background: '#e3f2fd',
                  color: '#1565c0',
                  borderRadius: '4px',
                  textDecoration: 'none',
                  fontSize: '14px'
                }}>
                  All Purchases
                </Link>
                <Link href="/admin/patients" style={{
                  padding: '12px 20px',
                  background: '#f3e5f5',
                  color: '#7b1fa2',
                  borderRadius: '4px',
                  textDecoration: 'none',
                  fontSize: '14px'
                }}>
                  Patient Directory
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// Stat Card Component
function StatCard({ label, value, subtext, color, href, isText }) {
  const content = (
    <div style={{
      background: 'white',
      borderRadius: '8px',
      padding: '16px 20px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      borderTop: `3px solid ${color}`,
      cursor: href ? 'pointer' : 'default'
    }}>
      <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '22px', fontWeight: '600' }}>{value}</div>
      {subtext && <div style={{ fontSize: '12px', color: '#999', marginTop: '2px' }}>{subtext}</div>}
    </div>
  );

  if (href) {
    return <Link href={href} style={{ textDecoration: 'none', color: 'inherit' }}>{content}</Link>;
  }
  return content;
}

// Service Card Component
function ServiceCard({ title, subtitle, color, linkText, linkHref, emptyText, items, renderItem }) {
  return (
    <div style={{
      background: 'white',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      overflow: 'hidden'
    }}>
      <div style={{
        padding: '14px 16px',
        borderBottom: '1px solid #e0e0e0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderLeft: `4px solid ${color}`
      }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '600' }}>{title}</h3>
          {subtitle && <span style={{ fontSize: '12px', color: '#666' }}>{subtitle}</span>}
        </div>
        <Link href={linkHref} style={{ fontSize: '12px', color: '#1976d2', textDecoration: 'none' }}>
          {linkText} →
        </Link>
      </div>
      <div style={{ maxHeight: '280px', overflow: 'auto' }}>
        {items.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#666', fontSize: '14px' }}>
            {emptyText}
          </div>
        ) : (
          items.map(renderItem)
        )}
      </div>
    </div>
  );
}
