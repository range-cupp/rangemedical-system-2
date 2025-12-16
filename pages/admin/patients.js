// /pages/admin/patients.js
// Patient Directory - List all patients
// Range Medical

import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function AdminPatients() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({ total: 0 });

  useEffect(() => {
    const stored = localStorage.getItem('adminPassword');
    if (stored) {
      setPassword(stored);
      setIsAuthenticated(true);
    }
  }, []);

  const fetchPatients = async () => {
    setLoading(true);
    setError('');
    
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      params.append('limit', '200');
      
      const res = await fetch(`/api/admin/patients?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${password}` }
      });
      
      if (!res.ok) throw new Error('Failed to fetch patients');
      
      const data = await res.json();
      setPatients(data.patients || []);
      setStats({ total: data.total || 0 });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) fetchPatients();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const timer = setTimeout(() => fetchPatients(), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch('/api/admin/patients?limit=1', {
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
      <Head><title>Patients | Range Medical</title></Head>
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
            <p style={{ margin: '4px 0 0', fontSize: '14px', opacity: 0.8 }}>Patient Directory</p>
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
            <div style={{ fontSize: '13px', color: '#666' }}>Total Patients</div>
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
            placeholder="Search by name, email, or phone..."
            style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', width: '300px' }}
          />

          <button onClick={fetchPatients} style={{
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
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#666' }}>Name</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#666' }}>Email</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#666' }}>Phone</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', color: '#666' }}>Protocols</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', color: '#666' }}>Purchases</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', color: '#666' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                    Loading patients...
                  </td>
                </tr>
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                    No patients found
                  </td>
                </tr>
              ) : (
                patients.map(patient => (
                  <tr key={patient.ghl_contact_id || patient.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: '500', fontSize: '14px' }}>{patient.patient_name}</div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: '#666' }}>
                      {patient.patient_email || '-'}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: '#666' }}>
                      {patient.patient_phone || '-'}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        background: patient.protocol_count > 0 ? '#e8f5e9' : '#f5f5f5',
                        color: patient.protocol_count > 0 ? '#2e7d32' : '#666',
                        borderRadius: '12px',
                        fontSize: '13px',
                        fontWeight: '500'
                      }}>
                        {patient.protocol_count || 0}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        background: patient.purchase_count > 0 ? '#e3f2fd' : '#f5f5f5',
                        color: patient.purchase_count > 0 ? '#1565c0' : '#666',
                        borderRadius: '12px',
                        fontSize: '13px',
                        fontWeight: '500'
                      }}>
                        {patient.purchase_count || 0}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        {patient.ghl_contact_id && (
                          <Link
                            href={`/admin/patient/${patient.ghl_contact_id}`}
                            style={{
                              padding: '6px 12px',
                              background: 'black',
                              color: 'white',
                              borderRadius: '4px',
                              fontSize: '12px',
                              textDecoration: 'none'
                            }}
                          >
                            View Profile
                          </Link>
                        )}
                        <Link
                          href={`/admin/protocols?search=${encodeURIComponent(patient.patient_name)}`}
                          style={{
                            padding: '6px 12px',
                            background: '#f5f5f5',
                            color: '#333',
                            borderRadius: '4px',
                            fontSize: '12px',
                            textDecoration: 'none',
                            border: '1px solid #ddd'
                          }}
                        >
                          Protocols
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
