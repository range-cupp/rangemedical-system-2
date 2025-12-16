// /pages/admin/purchases.js
// Purchase History Dashboard - Consistent Styling
// Range Medical

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

const CATEGORIES = [
  'All',
  'Peptide',
  'Weight Loss',
  'IV Therapy',
  'Injection',
  'Labs',
  'HRT',
  'Hyperbaric',
  'Red Light',
  'Consultation',
  'Product',
  'Other'
];

export default function AdminPurchases() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [initialized, setInitialized] = useState(false);
  
  // Filters
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState('30');

  // Stats
  const [stats, setStats] = useState({ total: 0, revenue: 0 });

  // Initialize from URL params
  useEffect(() => {
    if (router.isReady && !initialized) {
      const { category, search } = router.query;
      if (category && CATEGORIES.includes(category)) {
        setCategoryFilter(category);
      }
      if (search) {
        setSearchQuery(search);
      }
      setInitialized(true);
    }
  }, [router.isReady, router.query]);

  useEffect(() => {
    const stored = localStorage.getItem('adminPassword');
    if (stored) {
      setPassword(stored);
      setIsAuthenticated(true);
    }
  }, []);

  const fetchPurchases = async () => {
    setLoading(true);
    setError('');
    
    try {
      const params = new URLSearchParams();
      if (categoryFilter !== 'All') params.append('category', categoryFilter);
      if (searchQuery) params.append('search', searchQuery);
      if (dateRange !== 'all') params.append('days', dateRange);
      params.append('limit', '500');
      
      const res = await fetch(`/api/admin/purchases?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${password}` }
      });
      
      if (!res.ok) throw new Error('Failed to fetch purchases');
      
      const data = await res.json();
      setPurchases(data.purchases || []);
      setStats({ total: data.total || 0, revenue: data.revenue || 0 });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && initialized) fetchPurchases();
  }, [isAuthenticated, categoryFilter, dateRange, initialized]);

  useEffect(() => {
    if (!isAuthenticated || !initialized) return;
    const timer = setTimeout(() => fetchPurchases(), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch('/api/admin/purchases?limit=1', {
        headers: { 'Authorization': `Bearer ${password}` }
      });
      
      if (res.ok) {
        setIsAuthenticated(true);
        localStorage.setItem('adminPassword', password);
      } else {
        setError('Invalid password');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', { 
      month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency: 'USD', minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Peptide': { bg: '#e8f5e9', text: '#2e7d32' },
      'Weight Loss': { bg: '#fff3e0', text: '#ef6c00' },
      'IV Therapy': { bg: '#e3f2fd', text: '#1565c0' },
      'Injection': { bg: '#fce4ec', text: '#c2185b' },
      'Labs': { bg: '#f3e5f5', text: '#7b1fa2' },
      'HRT': { bg: '#e0f2f1', text: '#00695c' },
      'Hyperbaric': { bg: '#e8eaf6', text: '#3949ab' },
      'Red Light': { bg: '#ffebee', text: '#c62828' },
      'Consultation': { bg: '#f5f5f5', text: '#616161' }
    };
    return colors[category] || { bg: '#f5f5f5', text: '#616161' };
  };

  // Login screen
  if (!isAuthenticated) {
    return (
      <>
        <Head><title>Admin Login | Range Medical</title></Head>
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
              <h1 style={{ margin: '0 0 8px', fontSize: '28px', fontWeight: '600' }}>RANGE MEDICAL</h1>
              <p style={{ margin: 0, color: '#666' }}>Admin Dashboard</p>
            </div>
            {error && (
              <div style={{ background: '#ffebee', color: '#c62828', padding: '12px', borderRadius: '4px', marginBottom: '16px', fontSize: '14px' }}>
                {error}
              </div>
            )}
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '16px', marginBottom: '16px', boxSizing: 'border-box' }}
            />
            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '12px', background: 'black', color: 'white',
              border: 'none', borderRadius: '4px', fontSize: '16px', cursor: 'pointer'
            }}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </>
    );
  }

  return (
    <>
      <Head><title>Purchases | Range Medical</title></Head>
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
            <p style={{ margin: '4px 0 0', fontSize: '14px', opacity: 0.8 }}>
              {categoryFilter === 'All' ? 'Purchase History' : `${categoryFilter} Purchases`}
            </p>
          </div>
          <button onClick={() => {
            localStorage.removeItem('adminPassword');
            setIsAuthenticated(false);
          }} style={{
            padding: '8px 16px',
            background: 'transparent',
            color: 'white',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}>
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
            { href: '/admin/purchases', label: 'Purchases', active: true },
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

        {/* Stats Bar */}
        <div style={{
          background: 'white',
          borderBottom: '1px solid #e0e0e0',
          padding: '16px 24px',
          display: 'flex',
          gap: '32px'
        }}>
          <div>
            <div style={{ fontSize: '24px', fontWeight: '600' }}>{stats.total}</div>
            <div style={{ fontSize: '13px', color: '#666' }}>
              {categoryFilter === 'All' ? 'Purchases' : `${categoryFilter} Purchases`}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: '600' }}>{formatCurrency(stats.revenue)}</div>
            <div style={{ fontSize: '13px', color: '#666' }}>Revenue</div>
          </div>
        </div>

        {/* Filters */}
        <div style={{
          background: 'white',
          borderBottom: '1px solid #e0e0e0',
          padding: '16px 24px',
          display: 'flex',
          gap: '16px',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by patient or item..."
            style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', width: '250px' }}
          />
          
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              const newUrl = e.target.value === 'All' 
                ? '/admin/purchases' 
                : `/admin/purchases?category=${encodeURIComponent(e.target.value)}`;
              router.push(newUrl, undefined, { shallow: true });
            }}
            style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
          >
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
            <option value="all">All time</option>
          </select>

          <button onClick={fetchPurchases} style={{
            padding: '8px 16px',
            background: '#f5f5f5',
            border: '1px solid #ddd',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}>
            Refresh
          </button>
        </div>

        {/* Error */}
        {error && (
          <div style={{ margin: '16px 24px', background: '#ffebee', color: '#c62828', padding: '12px', borderRadius: '4px' }}>
            {error}
          </div>
        )}

        {/* Table */}
        <div style={{ padding: '24px', overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            background: 'white',
            borderRadius: '8px',
            borderCollapse: 'collapse',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#666' }}>Date</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#666' }}>Patient</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#666' }}>Item</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#666' }}>Category</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px', color: '#666' }}>Amount</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#666' }}>Source</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                    Loading purchases...
                  </td>
                </tr>
              ) : purchases.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                    No purchases found
                  </td>
                </tr>
              ) : (
                purchases.map(purchase => {
                  const catColor = getCategoryColor(purchase.category);
                  return (
                    <tr key={purchase.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '12px 16px', fontSize: '14px' }}>
                        {formatDate(purchase.purchase_date)}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: '500', fontSize: '14px' }}>{purchase.patient_name}</div>
                        <div style={{ fontSize: '12px', color: '#666' }}>{purchase.patient_email || '-'}</div>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '14px', maxWidth: '300px' }}>
                        {purchase.item_name}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '500',
                          background: catColor.bg,
                          color: catColor.text
                        }}>
                          {purchase.category}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '14px', textAlign: 'right', fontWeight: '500' }}>
                        {formatCurrency(purchase.amount)}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '12px', color: '#666' }}>
                        {purchase.source || '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
