// /pages/admin/review-purchases.js
// Review and fix purchase amounts (list price vs actual paid)
// Range Medical

import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function ReviewPurchases() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('discounted'); // 'discounted', 'all'
  const [saving, setSaving] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editAmount, setEditAmount] = useState('');

  const handleLogin = () => {
    if (password === 'range2024') {
      setIsAuthenticated(true);
    } else {
      alert('Invalid password');
    }
  };

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/purchases?limit=500');
      const data = await res.json();
      setPurchases(data.purchases || data || []);
    } catch (err) {
      console.error('Error fetching purchases:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchPurchases();
    }
  }, [isAuthenticated]);

  const handleSaveAmount = async (purchaseId) => {
    if (!editAmount || isNaN(parseFloat(editAmount))) {
      alert('Please enter a valid amount');
      return;
    }

    setSaving(purchaseId);
    try {
      const res = await fetch(`/api/admin/purchases/${purchaseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseFloat(editAmount) })
      });

      if (res.ok) {
        // Update local state
        setPurchases(purchases.map(p => 
          p.id === purchaseId ? { ...p, amount: parseFloat(editAmount) } : p
        ));
        setEditingId(null);
        setEditAmount('');
      } else {
        alert('Failed to save');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setSaving(null);
    }
  };

  // Filter purchases
  const filteredPurchases = purchases.filter(p => {
    if (filter === 'all') return true;
    // "discounted" = list_price exists and differs from amount (likely a discount)
    if (filter === 'discounted') {
      return p.list_price && Math.abs(p.list_price - p.amount) > 0.01;
    }
    return true;
  });

  // Sort by date (newest first)
  const sortedPurchases = [...filteredPurchases].sort((a, b) => 
    new Date(b.purchase_date || b.created_at) - new Date(a.purchase_date || a.created_at)
  );

  // Calculate stats
  const discountedCount = purchases.filter(p => p.list_price && Math.abs(p.list_price - p.amount) > 0.01).length;
  const totalListPrice = purchases.reduce((sum, p) => sum + (p.list_price || p.amount || 0), 0);
  const totalPaid = purchases.reduce((sum, p) => sum + (p.amount || 0), 0);

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return '-';
    return '$' + parseFloat(amount).toFixed(2);
  };

  // Login screen
  if (!isAuthenticated) {
    return (
      <>
        <Head><title>Review Purchases | Range Medical</title></Head>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
          <div style={{ background: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' }}>
            <h1 style={{ margin: '0 0 24px', fontSize: '24px', textAlign: 'center' }}>Review Purchases</h1>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              placeholder="Enter password"
              style={{ width: '100%', padding: '12px', fontSize: '16px', border: '1px solid #ddd', borderRadius: '6px', marginBottom: '16px', boxSizing: 'border-box' }}
            />
            <button
              onClick={handleLogin}
              style={{ width: '100%', padding: '12px', background: '#000', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '16px', cursor: 'pointer' }}
            >
              Login
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head><title>Review Purchases | Range Medical</title></Head>
      <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
        {/* Header */}
        <div style={{ background: '#000', color: '#fff', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>Review Purchase Amounts</h1>
            <p style={{ margin: '4px 0 0', fontSize: '13px', opacity: 0.7 }}>Verify list prices vs actual amounts paid</p>
          </div>
          <Link href="/admin" style={{ color: '#fff', textDecoration: 'none', fontSize: '14px' }}>
            ← Back to Admin
          </Link>
        </div>

        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
          {/* Stats */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
            <div style={{ background: 'white', padding: '16px 24px', borderRadius: '8px', border: '1px solid #e5e5e5' }}>
              <div style={{ fontSize: '28px', fontWeight: '700' }}>{purchases.length}</div>
              <div style={{ fontSize: '13px', color: '#666' }}>Total Purchases</div>
            </div>
            <div style={{ background: 'white', padding: '16px 24px', borderRadius: '8px', border: '1px solid #e5e5e5' }}>
              <div style={{ fontSize: '28px', fontWeight: '700', color: '#f59e0b' }}>{discountedCount}</div>
              <div style={{ fontSize: '13px', color: '#666' }}>With Discounts</div>
            </div>
            <div style={{ background: 'white', padding: '16px 24px', borderRadius: '8px', border: '1px solid #e5e5e5' }}>
              <div style={{ fontSize: '20px', fontWeight: '700' }}>{formatCurrency(totalListPrice)}</div>
              <div style={{ fontSize: '13px', color: '#666' }}>Total List Price</div>
            </div>
            <div style={{ background: 'white', padding: '16px 24px', borderRadius: '8px', border: '1px solid #e5e5e5' }}>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#22c55e' }}>{formatCurrency(totalPaid)}</div>
              <div style={{ fontSize: '13px', color: '#666' }}>Total Paid</div>
            </div>
          </div>

          {/* Filter Buttons */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            {['discounted', 'all'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: '8px 16px',
                  border: filter === f ? '2px solid #000' : '1px solid #ddd',
                  borderRadius: '6px',
                  background: filter === f ? '#000' : '#fff',
                  color: filter === f ? '#fff' : '#333',
                  fontSize: '14px',
                  cursor: 'pointer',
                  fontWeight: filter === f ? '600' : '400'
                }}
              >
                {f === 'discounted' ? `Discounted (${discountedCount})` : 'All Purchases'}
              </button>
            ))}
            <button
              onClick={fetchPurchases}
              disabled={loading}
              style={{
                padding: '8px 16px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                background: '#fff',
                fontSize: '14px',
                cursor: 'pointer',
                marginLeft: 'auto'
              }}
            >
              {loading ? 'Loading...' : '↻ Refresh'}
            </button>
          </div>

          {/* Info Box */}
          <div style={{ background: '#fef3c7', border: '1px solid #fbbf24', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px' }}>
            <p style={{ margin: 0, fontSize: '13px', color: '#92400e' }}>
              💡 Click "Edit" to fix any purchase where the Amount doesn't match what was actually paid. 
              The Amount column should reflect the actual payment received after any discounts.
            </p>
          </div>

          {/* Purchases Table */}
          <div style={{ background: 'white', borderRadius: '8px', border: '1px solid #e5e5e5', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ background: '#f9f9f9', borderBottom: '1px solid #e5e5e5' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Date</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Patient</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Item</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600' }}>List Price</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600' }}>Amount Paid</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600' }}>Discount</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                      Loading purchases...
                    </td>
                  </tr>
                ) : sortedPurchases.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                      No purchases found
                    </td>
                  </tr>
                ) : (
                  sortedPurchases.map(purchase => {
                    const isEditing = editingId === purchase.id;
                    const listPrice = purchase.list_price || purchase.amount;
                    const discount = listPrice - purchase.amount;
                    const discountPct = listPrice > 0 ? ((discount / listPrice) * 100).toFixed(0) : 0;
                    
                    return (
                      <tr 
                        key={purchase.id} 
                        style={{ borderBottom: '1px solid #f0f0f0' }}
                      >
                        <td style={{ padding: '12px 16px' }}>
                          {formatDate(purchase.purchase_date || purchase.created_at)}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontWeight: '500' }}>{purchase.patient_name || '-'}</div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div>{purchase.item_name}</div>
                          <div style={{ fontSize: '12px', color: '#666' }}>{purchase.category}</div>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', color: '#666' }}>
                          {formatCurrency(listPrice)}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          {isEditing ? (
                            <input
                              type="number"
                              step="0.01"
                              value={editAmount}
                              onChange={(e) => setEditAmount(e.target.value)}
                              style={{
                                width: '100px',
                                padding: '6px 8px',
                                border: '2px solid #000',
                                borderRadius: '4px',
                                fontSize: '14px',
                                textAlign: 'right'
                              }}
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveAmount(purchase.id);
                                if (e.key === 'Escape') { setEditingId(null); setEditAmount(''); }
                              }}
                            />
                          ) : (
                            <span style={{ fontWeight: '600' }}>
                              {formatCurrency(purchase.amount)}
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          {discount > 0.01 ? (
                            <span style={{ color: '#f59e0b', fontWeight: '500' }}>
                              -{formatCurrency(discount)} ({discountPct}%)
                            </span>
                          ) : (
                            <span style={{ color: '#999' }}>-</span>
                          )}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          {isEditing ? (
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                              <button
                                onClick={() => handleSaveAmount(purchase.id)}
                                disabled={saving === purchase.id}
                                style={{
                                  padding: '6px 12px',
                                  background: '#000',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: '4px',
                                  fontSize: '13px',
                                  cursor: 'pointer'
                                }}
                              >
                                {saving === purchase.id ? '...' : 'Save'}
                              </button>
                              <button
                                onClick={() => { setEditingId(null); setEditAmount(''); }}
                                style={{
                                  padding: '6px 12px',
                                  background: '#fff',
                                  border: '1px solid #ddd',
                                  borderRadius: '4px',
                                  fontSize: '13px',
                                  cursor: 'pointer'
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => { setEditingId(purchase.id); setEditAmount(purchase.amount?.toString() || ''); }}
                              style={{
                                padding: '6px 12px',
                                background: '#fff',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '13px',
                                cursor: 'pointer'
                              }}
                            >
                              Edit
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          {!loading && sortedPurchases.length > 0 && (
            <div style={{ marginTop: '16px', padding: '12px 16px', background: '#f9f9f9', borderRadius: '8px', fontSize: '13px', color: '#666' }}>
              Showing {sortedPurchases.length} of {purchases.length} purchases
            </div>
          )}
        </div>
      </div>
    </>
  );
}
