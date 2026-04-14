// /pages/admin/actions.js
// Daily Action Board — Who needs medication? Who's due for payment?
// Range Medical

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout, { sharedStyles } from '../../components/AdminLayout';
import { getCategoryBadge, formatDate } from '../../lib/protocol-tracking';

export default function ActionsPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('medication');

  useEffect(() => {
    fetch('/api/admin/actions')
      .then(r => r.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const statusBadge = (status, color) => {
    const colors = {
      red: { bg: '#fee2e2', text: '#991b1b' },
      yellow: { bg: '#fef3c7', text: '#92400e' },
      gray: { bg: '#f3f4f6', text: '#374151' }
    };
    const c = colors[color] || colors.gray;
    return {
      display: 'inline-block',
      padding: '4px 10px',
      fontSize: '12px',
      fontWeight: '700',
      letterSpacing: '0.5px',
      background: c.bg,
      color: c.text
    };
  };

  const medCount = data?.medication_due?.length || 0;
  const payCount = data?.payment_due?.length || 0;
  const medOverdue = data?.counts?.medication_overdue || 0;
  const payOverdue = data?.counts?.payment_overdue || 0;

  return (
    <AdminLayout title="Actions">
      <div style={sharedStyles.pageHeader}>
        <h1 style={sharedStyles.pageTitle}>Daily Actions</h1>
        <p style={sharedStyles.pageSubtitle}>
          Who needs medication and who's due for payment — work top to bottom.
        </p>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '28px' }}>
        <div
          onClick={() => setActiveTab('medication')}
          style={{
            ...sharedStyles.card,
            padding: '20px 24px',
            cursor: 'pointer',
            borderLeft: activeTab === 'medication' ? '4px solid #000' : '4px solid transparent'
          }}
        >
          <div style={{ fontSize: '14px', color: '#666', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Medication Due
          </div>
          <div style={{ fontSize: '36px', fontWeight: '700', marginTop: '4px' }}>
            {loading ? '-' : medCount}
          </div>
          {medOverdue > 0 && (
            <div style={{ fontSize: '14px', color: '#dc2626', fontWeight: '600', marginTop: '4px' }}>
              {medOverdue} overdue
            </div>
          )}
        </div>
        <div
          onClick={() => setActiveTab('payment')}
          style={{
            ...sharedStyles.card,
            padding: '20px 24px',
            cursor: 'pointer',
            borderLeft: activeTab === 'payment' ? '4px solid #000' : '4px solid transparent'
          }}
        >
          <div style={{ fontSize: '14px', color: '#666', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Payment Due
          </div>
          <div style={{ fontSize: '36px', fontWeight: '700', marginTop: '4px' }}>
            {loading ? '-' : payCount}
          </div>
          {payOverdue > 0 && (
            <div style={{ fontSize: '14px', color: '#dc2626', fontWeight: '600', marginTop: '4px' }}>
              {payOverdue} overdue
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#999', fontSize: '16px' }}>
          Loading...
        </div>
      ) : (
        <div style={sharedStyles.card}>
          {/* Tab header */}
          <div style={{ ...sharedStyles.cardHeader, gap: '0' }}>
            <div style={{ display: 'flex', gap: '0' }}>
              <button
                onClick={() => setActiveTab('medication')}
                style={{
                  padding: '10px 24px',
                  fontSize: '15px',
                  fontWeight: activeTab === 'medication' ? '600' : '400',
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === 'medication' ? '2px solid #000' : '2px solid transparent',
                  cursor: 'pointer',
                  color: activeTab === 'medication' ? '#000' : '#666'
                }}
              >
                Medication Due ({medCount})
              </button>
              <button
                onClick={() => setActiveTab('payment')}
                style={{
                  padding: '10px 24px',
                  fontSize: '15px',
                  fontWeight: activeTab === 'payment' ? '600' : '400',
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === 'payment' ? '2px solid #000' : '2px solid transparent',
                  cursor: 'pointer',
                  color: activeTab === 'payment' ? '#000' : '#666'
                }}
              >
                Payment Due ({payCount})
              </button>
            </div>
          </div>

          {/* Medication table */}
          {activeTab === 'medication' && (
            <div style={{ overflowX: 'auto' }}>
              {medCount === 0 ? (
                <div style={{ padding: '48px 24px', textAlign: 'center', color: '#999', fontSize: '16px' }}>
                  No medication due right now. Everyone's supplied.
                </div>
              ) : (
                <table style={sharedStyles.table}>
                  <thead>
                    <tr>
                      <th style={sharedStyles.th}>Status</th>
                      <th style={sharedStyles.th}>Patient</th>
                      <th style={sharedStyles.th}>Protocol</th>
                      <th style={sharedStyles.th}>Details</th>
                      <th style={sharedStyles.th}>Last Dispensed</th>
                      <th style={sharedStyles.th}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.medication_due.map((item, i) => {
                      const badge = getCategoryBadge(item.category);
                      return (
                        <tr
                          key={`med-${i}`}
                          style={{ ...sharedStyles.trHover, background: item.color === 'red' ? '#fef2f2' : 'transparent' }}
                          onMouseEnter={e => { if (item.color !== 'red') e.currentTarget.style.background = '#fafafa'; }}
                          onMouseLeave={e => { if (item.color !== 'red') e.currentTarget.style.background = 'transparent'; }}
                        >
                          <td style={sharedStyles.td}>
                            <span style={statusBadge(item.status, item.color)}>{item.status}</span>
                          </td>
                          <td style={{ ...sharedStyles.td, fontWeight: '600' }}>
                            <span
                              style={{ cursor: 'pointer', color: '#000', textDecoration: 'none' }}
                              onClick={() => router.push(`/patients/${item.patient_id}`)}
                            >
                              {item.patient_name}
                            </span>
                          </td>
                          <td style={sharedStyles.td}>
                            <span style={{
                              display: 'inline-block',
                              padding: '3px 8px',
                              fontSize: '12px',
                              fontWeight: '600',
                              background: badge.color,
                              marginRight: '8px'
                            }}>
                              {badge.text}
                            </span>
                            {item.medication}
                          </td>
                          <td style={{ ...sharedStyles.td, color: '#666' }}>
                            {item.days_remaining !== null && item.days_remaining !== undefined
                              ? (item.days_remaining <= 0
                                ? `${Math.abs(item.days_remaining)}d overdue`
                                : `${item.days_remaining}d left`)
                              : item.sessions_remaining !== null && item.sessions_remaining !== undefined
                                ? `${item.sessions_remaining} sessions left`
                                : item.status_text || '-'
                            }
                          </td>
                          <td style={{ ...sharedStyles.td, color: '#666' }}>
                            {item.last_dispensed ? formatDate(item.last_dispensed) : 'Never'}
                          </td>
                          <td style={sharedStyles.td}>
                            <button
                              onClick={() => router.push(`/patients/${item.patient_id}?tab=messages`)}
                              style={{ ...sharedStyles.btnPrimary, ...sharedStyles.btnSmall }}
                            >
                              Text
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Payment table */}
          {activeTab === 'payment' && (
            <div style={{ overflowX: 'auto' }}>
              {payCount === 0 ? (
                <div style={{ padding: '48px 24px', textAlign: 'center', color: '#999', fontSize: '16px' }}>
                  No payments due right now. Everyone's current.
                </div>
              ) : (
                <table style={sharedStyles.table}>
                  <thead>
                    <tr>
                      <th style={sharedStyles.th}>Status</th>
                      <th style={sharedStyles.th}>Patient</th>
                      <th style={sharedStyles.th}>Protocol</th>
                      <th style={sharedStyles.th}>Last Payment</th>
                      <th style={sharedStyles.th}>Next Due</th>
                      <th style={sharedStyles.th}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.payment_due.map((item, i) => {
                      const badge = getCategoryBadge(item.category);
                      return (
                        <tr
                          key={`pay-${i}`}
                          style={{ ...sharedStyles.trHover, background: item.color === 'red' ? '#fef2f2' : 'transparent' }}
                          onMouseEnter={e => { if (item.color !== 'red') e.currentTarget.style.background = '#fafafa'; }}
                          onMouseLeave={e => { if (item.color !== 'red') e.currentTarget.style.background = 'transparent'; }}
                        >
                          <td style={sharedStyles.td}>
                            <span style={statusBadge(item.status, item.color)}>{item.status}</span>
                          </td>
                          <td style={{ ...sharedStyles.td, fontWeight: '600' }}>
                            <span
                              style={{ cursor: 'pointer', color: '#000', textDecoration: 'none' }}
                              onClick={() => router.push(`/patients/${item.patient_id}`)}
                            >
                              {item.patient_name}
                            </span>
                          </td>
                          <td style={sharedStyles.td}>
                            <span style={{
                              display: 'inline-block',
                              padding: '3px 8px',
                              fontSize: '12px',
                              fontWeight: '600',
                              background: badge.color,
                              marginRight: '8px'
                            }}>
                              {badge.text}
                            </span>
                            {item.medication}
                          </td>
                          <td style={{ ...sharedStyles.td, color: '#666' }}>
                            {item.last_payment ? formatDate(item.last_payment) : 'No payment recorded'}
                            {item.last_amount ? ` ($${item.last_amount})` : ''}
                          </td>
                          <td style={{ ...sharedStyles.td, color: '#666' }}>
                            {item.next_due ? formatDate(item.next_due) : '-'}
                            {item.days_until !== null && item.days_until !== undefined && (
                              <span style={{ marginLeft: '8px', color: item.days_until <= 0 ? '#dc2626' : '#666' }}>
                                ({item.days_until <= 0 ? `${Math.abs(item.days_until)}d overdue` : `${item.days_until}d`})
                              </span>
                            )}
                          </td>
                          <td style={sharedStyles.td}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                onClick={() => router.push(`/patients/${item.patient_id}?tab=messages`)}
                                style={{ ...sharedStyles.btnSecondary, ...sharedStyles.btnSmall }}
                              >
                                Text
                              </button>
                              <button
                                onClick={() => router.push(`/admin/checkout?patient_id=${item.patient_id}`)}
                                style={{ ...sharedStyles.btnPrimary, ...sharedStyles.btnSmall }}
                              >
                                Charge
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
