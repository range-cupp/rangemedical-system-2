// /pages/admin/protocols.js
// Protocol Management Dashboard - CRUD Interface
// Range Medical - Consistent with Dashboard styling

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

const PROGRAM_TYPES = [
  { value: 'injection_clinic', label: 'Injection (In-Clinic)' },
  { value: 'jumpstart_10day', label: 'Jumpstart (10-Day)' },
  { value: 'recovery_10day', label: 'Recovery (10-Day)' },
  { value: 'month_30day', label: 'Month Program (30-Day)' }
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'paused', label: 'Paused' },
  { value: 'cancelled', label: 'Cancelled' }
];

export default function AdminProtocols() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [protocols, setProtocols] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Filters - initialize from URL params
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [initialized, setInitialized] = useState(false);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [editingProtocol, setEditingProtocol] = useState(null);
  
  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingProtocol, setDeletingProtocol] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    patient_name: '',
    patient_email: '',
    patient_phone: '',
    ghl_contact_id: '',
    program_type: 'month_30day',
    program_name: '',
    start_date: new Date().toISOString().split('T')[0],
    duration_days: 30,
    status: 'active',
    primary_peptide: '',
    secondary_peptide: '',
    dose_amount: '',
    dose_frequency: '',
    special_instructions: '',
    notes: '',
    reminders_enabled: true
  });

  // Initialize from URL params
  useEffect(() => {
    if (router.isReady && !initialized) {
      const { status } = router.query;
      if (status && ['active', 'completed', 'paused', 'cancelled'].includes(status)) {
        setStatusFilter(status);
      }
      setInitialized(true);
    }
  }, [router.isReady, router.query]);

  // Check stored password on mount
  useEffect(() => {
    const stored = localStorage.getItem('adminPassword');
    if (stored) {
      setPassword(stored);
      setIsAuthenticated(true);
    }
  }, []);

  // Fetch protocols when authenticated and filters change
  useEffect(() => {
    if (isAuthenticated && initialized) {
      fetchProtocols();
    }
  }, [isAuthenticated, statusFilter, initialized]);

  // Debounced search
  useEffect(() => {
    if (!isAuthenticated || !initialized) return;
    const timer = setTimeout(() => {
      fetchProtocols();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchProtocols = async () => {
    setLoading(true);
    setError('');
    
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (searchQuery) params.append('search', searchQuery);
      params.append('limit', '200');
      
      const res = await fetch(`/api/admin/protocols?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${password}` }
      });
      
      if (!res.ok) throw new Error('Failed to fetch protocols');
      
      const data = await res.json();
      setProtocols(data.protocols || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/admin/protocols?limit=1', {
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

  const openCreateModal = () => {
    setFormData({
      patient_name: '',
      patient_email: '',
      patient_phone: '',
      ghl_contact_id: '',
      program_type: 'month_30day',
      program_name: '',
      start_date: new Date().toISOString().split('T')[0],
      duration_days: 30,
      status: 'active',
      primary_peptide: '',
      secondary_peptide: '',
      dose_amount: '',
      dose_frequency: '',
      special_instructions: '',
      notes: '',
      reminders_enabled: true
    });
    setModalMode('create');
    setShowModal(true);
  };

  const openEditModal = (protocol) => {
    setEditingProtocol(protocol);
    setFormData({
      patient_name: protocol.patient_name || '',
      patient_email: protocol.patient_email || '',
      patient_phone: protocol.patient_phone || '',
      ghl_contact_id: protocol.ghl_contact_id || '',
      program_type: protocol.program_type || 'month_30day',
      program_name: protocol.program_name || '',
      start_date: protocol.start_date || '',
      duration_days: protocol.duration_days || 30,
      status: protocol.status || 'active',
      primary_peptide: protocol.primary_peptide || '',
      secondary_peptide: protocol.secondary_peptide || '',
      dose_amount: protocol.dose_amount || '',
      dose_frequency: protocol.dose_frequency || '',
      special_instructions: protocol.special_instructions || '',
      notes: protocol.notes || '',
      reminders_enabled: protocol.reminders_enabled !== false
    });
    setModalMode('edit');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const url = modalMode === 'create' 
        ? '/api/admin/protocols'
        : `/api/admin/protocols?id=${editingProtocol.id}`;
      
      const method = modalMode === 'create' ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${password}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to save protocol');

      setSuccess(modalMode === 'create' 
        ? `Protocol created for ${formData.patient_name}` 
        : `Protocol updated for ${formData.patient_name}`);
      setShowModal(false);
      fetchProtocols();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingProtocol) return;
    
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`/api/admin/protocols?id=${deletingProtocol.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${password}` }
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to delete protocol');

      setSuccess(`Protocol deleted: ${deletingProtocol.program_name}`);
      setShowDeleteConfirm(false);
      setDeletingProtocol(null);
      fetchProtocols();
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return { bg: '#e8f5e9', text: '#2e7d32' };
      case 'completed': return { bg: '#e3f2fd', text: '#1565c0' };
      case 'paused': return { bg: '#fff3e0', text: '#ef6c00' };
      case 'cancelled': return { bg: '#ffebee', text: '#c62828' };
      default: return { bg: '#f5f5f5', text: '#616161' };
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
              border: 'none', borderRadius: '4px', fontSize: '16px', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1
            }}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </>
    );
  }

  // Main page
  return (
    <>
      <Head><title>Protocols | Range Medical</title></Head>
      <div style={{
        minHeight: '100vh',
        background: '#f5f5f5',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        {/* Header - Matches Dashboard */}
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
            <p style={{ margin: '4px 0 0', fontSize: '14px', opacity: 0.8 }}>Protocol Management</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={openCreateModal} style={{
              padding: '8px 16px',
              background: 'white',
              color: 'black',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              + New Protocol
            </button>
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
          </div>
        </header>

        {/* Navigation - Matches Dashboard */}
        <nav style={{
          background: 'white',
          borderBottom: '1px solid #e0e0e0',
          padding: '0 24px',
          display: 'flex',
          gap: '0'
        }}>
          {[
            { href: '/admin/dashboard', label: 'Dashboard' },
            { href: '/admin/protocols', label: 'Protocols', active: true },
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

        {/* Stats Bar */}
        <div style={{
          background: 'white',
          borderBottom: '1px solid #e0e0e0',
          padding: '16px 24px',
          display: 'flex',
          gap: '32px'
        }}>
          <div>
            <div style={{ fontSize: '24px', fontWeight: '600' }}>{protocols.length}</div>
            <div style={{ fontSize: '13px', color: '#666' }}>
              {statusFilter === 'all' ? 'Total Protocols' : `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Protocols`}
            </div>
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
            placeholder="Search by name, email, or program..."
            style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', width: '300px' }}
          />
          
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              // Update URL without reload
              const newUrl = e.target.value === 'all' 
                ? '/admin/protocols' 
                : `/admin/protocols?status=${e.target.value}`;
              router.push(newUrl, undefined, { shallow: true });
            }}
            style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
          >
            <option value="all">All Statuses</option>
            {STATUS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <button onClick={fetchProtocols} style={{
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

        {/* Messages */}
        {(error || success) && (
          <div style={{ padding: '0 24px', marginTop: '16px' }}>
            {error && (
              <div style={{ background: '#ffebee', color: '#c62828', padding: '12px 16px', borderRadius: '4px', marginBottom: '8px' }}>
                {error}
              </div>
            )}
            {success && (
              <div style={{ background: '#e8f5e9', color: '#2e7d32', padding: '12px 16px', borderRadius: '4px' }}>
                {success}
              </div>
            )}
          </div>
        )}

        {/* Protocol Table */}
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
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#666' }}>Patient</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#666' }}>Program</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#666' }}>Type</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#666' }}>Start</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#666' }}>End</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#666' }}>Progress</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#666' }}>Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', color: '#666' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && protocols.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                    Loading protocols...
                  </td>
                </tr>
              ) : protocols.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                    No protocols found
                  </td>
                </tr>
              ) : (
                protocols.map(protocol => {
                  const statusColor = getStatusColor(protocol.status);
                  const progress = protocol.duration_days > 0 
                    ? Math.round((protocol.injections_completed || 0) / protocol.duration_days * 100) 
                    : 0;
                  
                  return (
                    <tr key={protocol.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: '500' }}>{protocol.patient_name}</div>
                        <div style={{ fontSize: '12px', color: '#666' }}>{protocol.patient_email || '-'}</div>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '14px' }}>
                        {protocol.program_name || '-'}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '14px' }}>
                        {PROGRAM_TYPES.find(t => t.value === protocol.program_type)?.label || protocol.program_type}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '14px' }}>
                        {formatDate(protocol.start_date)}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '14px' }}>
                        {formatDate(protocol.end_date)}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            width: '60px',
                            height: '6px',
                            background: '#e0e0e0',
                            borderRadius: '3px',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              width: `${Math.min(progress, 100)}%`,
                              height: '100%',
                              background: progress >= 100 ? '#4caf50' : '#2196f3'
                            }} />
                          </div>
                          <span style={{ fontSize: '12px', color: '#666' }}>
                            {protocol.injections_completed || 0}/{protocol.duration_days || 0}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '500',
                          background: statusColor.bg,
                          color: statusColor.text
                        }}>
                          {protocol.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          {protocol.access_token && (
                            <a
                              href={`/track/${protocol.access_token}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                padding: '6px 12px',
                                background: '#e3f2fd',
                                color: '#1565c0',
                                borderRadius: '4px',
                                fontSize: '12px',
                                textDecoration: 'none'
                              }}
                            >
                              View
                            </a>
                          )}
                          <button
                            onClick={() => openEditModal(protocol)}
                            style={{
                              padding: '6px 12px',
                              background: '#f5f5f5',
                              border: '1px solid #ddd',
                              borderRadius: '4px',
                              fontSize: '12px',
                              cursor: 'pointer'
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              setDeletingProtocol(protocol);
                              setShowDeleteConfirm(true);
                            }}
                            style={{
                              padding: '6px 12px',
                              background: '#ffebee',
                              color: '#c62828',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '12px',
                              cursor: 'pointer'
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Create/Edit Modal */}
        {showModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: 'white',
              borderRadius: '8px',
              width: '100%',
              maxWidth: '600px',
              maxHeight: '90vh',
              overflow: 'auto',
              margin: '20px'
            }}>
              <div style={{
                padding: '20px',
                borderBottom: '1px solid #e0e0e0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'black',
                color: 'white',
                borderRadius: '8px 8px 0 0'
              }}>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
                  {modalMode === 'create' ? 'New Protocol' : 'Edit Protocol'}
                </h2>
                <button onClick={() => setShowModal(false)} style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: 'white',
                  lineHeight: 1
                }}>
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  {/* Patient Info */}
                  <div style={{ gridColumn: '1 / -1' }}>
                    <h3 style={{ margin: '0 0 12px', fontSize: '14px', color: '#666', fontWeight: '600' }}>Patient Information</h3>
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: '#333', fontWeight: '500' }}>
                      Patient Name *
                    </label>
                    <input
                      type="text"
                      value={formData.patient_name}
                      onChange={(e) => setFormData({ ...formData, patient_name: e.target.value })}
                      required
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: '#333', fontWeight: '500' }}>
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.patient_email}
                      onChange={(e) => setFormData({ ...formData, patient_email: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: '#333', fontWeight: '500' }}>
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.patient_phone}
                      onChange={(e) => setFormData({ ...formData, patient_phone: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: '#333', fontWeight: '500' }}>
                      GHL Contact ID
                    </label>
                    <input
                      type="text"
                      value={formData.ghl_contact_id}
                      onChange={(e) => setFormData({ ...formData, ghl_contact_id: e.target.value })}
                      placeholder="Optional"
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' }}
                    />
                  </div>

                  {/* Program Info */}
                  <div style={{ gridColumn: '1 / -1', marginTop: '8px' }}>
                    <h3 style={{ margin: '0 0 12px', fontSize: '14px', color: '#666', fontWeight: '600' }}>Program Details</h3>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: '#333', fontWeight: '500' }}>
                      Program Type *
                    </label>
                    <select
                      value={formData.program_type}
                      onChange={(e) => setFormData({ ...formData, program_type: e.target.value })}
                      required
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' }}
                    >
                      {PROGRAM_TYPES.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: '#333', fontWeight: '500' }}>
                      Program Name *
                    </label>
                    <input
                      type="text"
                      value={formData.program_name}
                      onChange={(e) => setFormData({ ...formData, program_name: e.target.value })}
                      required
                      placeholder="e.g., BPC-157 Recovery Program"
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: '#333', fontWeight: '500' }}>
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: '#333', fontWeight: '500' }}>
                      Duration (Days)
                    </label>
                    <input
                      type="number"
                      value={formData.duration_days}
                      onChange={(e) => setFormData({ ...formData, duration_days: parseInt(e.target.value) || 30 })}
                      min="1"
                      max="365"
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' }}
                    />
                  </div>

                  {modalMode === 'edit' && (
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: '#333', fontWeight: '500' }}>
                        Status
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' }}
                      >
                        {STATUS_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Peptide Details */}
                  <div style={{ gridColumn: '1 / -1', marginTop: '8px' }}>
                    <h3 style={{ margin: '0 0 12px', fontSize: '14px', color: '#666', fontWeight: '600' }}>Peptide Details (Optional)</h3>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: '#333', fontWeight: '500' }}>
                      Primary Peptide
                    </label>
                    <input
                      type="text"
                      value={formData.primary_peptide}
                      onChange={(e) => setFormData({ ...formData, primary_peptide: e.target.value })}
                      placeholder="e.g., BPC-157"
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: '#333', fontWeight: '500' }}>
                      Secondary Peptide
                    </label>
                    <input
                      type="text"
                      value={formData.secondary_peptide}
                      onChange={(e) => setFormData({ ...formData, secondary_peptide: e.target.value })}
                      placeholder="e.g., TB-500"
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: '#333', fontWeight: '500' }}>
                      Dose Amount
                    </label>
                    <input
                      type="text"
                      value={formData.dose_amount}
                      onChange={(e) => setFormData({ ...formData, dose_amount: e.target.value })}
                      placeholder="e.g., 0.5ml"
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: '#333', fontWeight: '500' }}>
                      Dose Frequency
                    </label>
                    <input
                      type="text"
                      value={formData.dose_frequency}
                      onChange={(e) => setFormData({ ...formData, dose_frequency: e.target.value })}
                      placeholder="e.g., Once daily"
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' }}
                    />
                  </div>

                  {/* Notes */}
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: '#333', fontWeight: '500' }}>
                      Special Instructions
                    </label>
                    <textarea
                      value={formData.special_instructions}
                      onChange={(e) => setFormData({ ...formData, special_instructions: e.target.value })}
                      rows={3}
                      placeholder="Instructions for the patient..."
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box', resize: 'vertical' }}
                    />
                  </div>

                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: '#333', fontWeight: '500' }}>
                      Internal Notes
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={2}
                      placeholder="Staff-only notes..."
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box', resize: 'vertical' }}
                    />
                  </div>

                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={formData.reminders_enabled}
                        onChange={(e) => setFormData({ ...formData, reminders_enabled: e.target.checked })}
                        style={{ width: '16px', height: '16px' }}
                      />
                      <span style={{ fontSize: '14px' }}>Enable daily injection reminders</span>
                    </label>
                  </div>
                </div>

                {/* Submit buttons */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '12px',
                  marginTop: '24px',
                  paddingTop: '16px',
                  borderTop: '1px solid #e0e0e0'
                }}>
                  <button type="button" onClick={() => setShowModal(false)} style={{
                    padding: '10px 20px',
                    background: '#f5f5f5',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}>
                    Cancel
                  </button>
                  <button type="submit" disabled={loading} style={{
                    padding: '10px 20px',
                    background: 'black',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '14px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.7 : 1
                  }}>
                    {loading ? 'Saving...' : (modalMode === 'create' ? 'Create Protocol' : 'Save Changes')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && deletingProtocol && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1001
          }}>
            <div style={{
              background: 'white',
              borderRadius: '8px',
              width: '100%',
              maxWidth: '400px',
              margin: '20px',
              overflow: 'hidden'
            }}>
              <div style={{ background: '#c62828', color: 'white', padding: '16px 20px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Delete Protocol?</h3>
              </div>
              <div style={{ padding: '20px' }}>
                <p style={{ margin: '0 0 8px', color: '#666' }}>
                  Are you sure you want to delete this protocol?
                </p>
                <p style={{ margin: '0 0 16px' }}>
                  <strong>{deletingProtocol.program_name}</strong> for <strong>{deletingProtocol.patient_name}</strong>
                </p>
                <p style={{ margin: '0 0 20px', color: '#c62828', fontSize: '13px' }}>
                  This will also delete all injection logs. This action cannot be undone.
                </p>
                
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <button onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeletingProtocol(null);
                  }} style={{
                    padding: '10px 20px',
                    background: '#f5f5f5',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}>
                    Cancel
                  </button>
                  <button onClick={handleDelete} disabled={loading} style={{
                    padding: '10px 20px',
                    background: '#c62828',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '14px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.7 : 1
                  }}>
                    {loading ? 'Deleting...' : 'Delete Protocol'}
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
