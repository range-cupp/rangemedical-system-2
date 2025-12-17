// /pages/admin/patient/[id].js
// Patient Profile Page with Consent Center
// Range Medical - Black & White Design System

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

// ============================================
// ALL CONSENTS CONFIGURATION
// ============================================
const ALL_CONSENTS = [
  { id: 'intake', name: 'Medical Intake Form', url: 'https://app.range-medical.com/intake.html', type: 'intake' },
  { id: 'peptide', name: 'Peptide Therapy Consent', url: 'https://range-medical.com/peptide-therapy-consent-page', type: 'consent' },
  { id: 'iv-injection', name: 'IV & Injection Consent', url: 'https://range-medical.com/iv--injection-therapy-consent-page', type: 'consent' },
  { id: 'blood_draw', name: 'Blood Draw Consent', url: 'https://range-medical.com/blood-draw-consent-page', type: 'consent' },
  { id: 'exosome-iv', name: 'Exosome IV Consent', url: 'https://range-medical.com/exosome-iv-therapy-consent-page', type: 'consent' },
  { id: 'hrt', name: 'HRT Consent', url: 'https://range-medical.com/hrt-consent-page', type: 'consent' },
  { id: 'hbot', name: 'Hyperbaric Oxygen Consent', url: 'https://range-medical.com/hyperbaric-oxygen-therapy-consent-page', type: 'consent' },
  { id: 'red-light', name: 'Red Light Therapy Consent', url: 'https://range-medical.com/red-light-therapy-consent-page', type: 'consent' },
  { id: 'weight-loss', name: 'Weight Loss Consent', url: 'https://range-medical.com/weight-loss-consent-page', type: 'consent' },
  { id: 'prp', name: 'PRP Consent', url: 'https://range-medical.com/prp-consent-page', type: 'consent' },
  { id: 'testosterone-pellet', name: 'Testosterone Pellet Consent', url: 'https://range-medical.com/testosterone-pellet-consent-page', type: 'consent' },
  { id: 'trt-fertility', name: 'TRT Fertility Waiver', url: 'https://range-medical.com/trt-fertility-waiver-page', type: 'consent' },
];

// ============================================
// CONSENT CENTER COMPONENT
// ============================================
function ConsentCenter({ patientId, patientName, ghlContactId, completedConsents = [], completedIntakes = [] }) {
  const [sendingId, setSendingId] = useState(null);
  const [sentIds, setSentIds] = useState(new Set());
  const [error, setError] = useState(null);

  const getCompletedRecord = (consentId) => {
    if (consentId === 'intake') {
      return completedIntakes.length > 0 ? completedIntakes[0] : null;
    }
    return completedConsents.find(c => c.consent_type === consentId);
  };

  const sendConsent = async (consent) => {
    if (!ghlContactId) {
      setError('No GHL contact ID - cannot send SMS');
      return;
    }

    setSendingId(consent.id);
    setError(null);

    try {
      const response = await fetch('/api/admin/send-form-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ghlContactId,
          patientName,
          formType: consent.name,
          formUrl: consent.url
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send');
      }

      setSentIds(prev => new Set([...prev, consent.id]));
    } catch (err) {
      setError(err.message);
    } finally {
      setSendingId(null);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', { 
      month: 'short', day: 'numeric', year: 'numeric' 
    });
  };

  const completedCount = ALL_CONSENTS.filter(c => getCompletedRecord(c.id)).length;

  return (
    <div style={{
      background: 'white',
      borderRadius: '8px',
      border: '1px solid #e5e5e5',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid #e5e5e5',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: 'black' }}>
            Consent Center
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#666' }}>
            {completedCount} of {ALL_CONSENTS.length} completed
          </p>
        </div>
        <div style={{
          background: completedCount === ALL_CONSENTS.length ? '#000' : '#f5f5f5',
          color: completedCount === ALL_CONSENTS.length ? '#fff' : '#666',
          padding: '6px 12px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: '500'
        }}>
          {completedCount === ALL_CONSENTS.length ? '✓ All Complete' : `${ALL_CONSENTS.length - completedCount} pending`}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div style={{
          padding: '12px 20px',
          background: '#fef2f2',
          color: '#991b1b',
          fontSize: '13px',
          borderBottom: '1px solid #fecaca'
        }}>
          {error}
        </div>
      )}

      {/* Consent List */}
      <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
        {ALL_CONSENTS.map((consent, index) => {
          const completed = getCompletedRecord(consent.id);
          const isSending = sendingId === consent.id;
          const wasSent = sentIds.has(consent.id);

          return (
            <div
              key={consent.id}
              style={{
                padding: '14px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: index < ALL_CONSENTS.length - 1 ? '1px solid #f0f0f0' : 'none',
                background: completed ? '#fafafa' : 'white'
              }}
            >
              {/* Left side */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: completed ? '#000' : '#fff',
                  border: completed ? 'none' : '2px solid #e5e5e5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {completed ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  ) : (
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#e5e5e5' }} />
                  )}
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: completed ? '#666' : '#000' }}>
                    {consent.name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#999', marginTop: '2px' }}>
                    {completed ? `Completed ${formatDate(completed.submitted_at)}` : 'Not completed'}
                  </div>
                </div>
              </div>

              {/* Right side - actions */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {completed && completed.pdf_url && (
                  <a
                    href={completed.pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: '6px 12px',
                      fontSize: '12px',
                      fontWeight: '500',
                      color: '#000',
                      background: '#f5f5f5',
                      border: 'none',
                      borderRadius: '4px',
                      textDecoration: 'none'
                    }}
                  >
                    View PDF
                  </a>
                )}

                <button
                  onClick={() => sendConsent(consent)}
                  disabled={isSending || !ghlContactId}
                  style={{
                    padding: '6px 14px',
                    fontSize: '12px',
                    fontWeight: '500',
                    color: wasSent ? '#16a34a' : (completed ? '#666' : '#fff'),
                    background: wasSent ? '#f0fdf4' : (completed ? '#fff' : '#000'),
                    border: wasSent ? '1px solid #bbf7d0' : (completed ? '1px solid #e5e5e5' : 'none'),
                    borderRadius: '4px',
                    cursor: isSending || !ghlContactId ? 'not-allowed' : 'pointer',
                    opacity: isSending ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {isSending ? (
                    'Sending...'
                  ) : wasSent ? (
                    <>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      Sent
                    </>
                  ) : (
                    <>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 2L11 13"></path>
                        <path d="M22 2L15 22L11 13L2 9L22 2Z"></path>
                      </svg>
                      Send
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{
        padding: '12px 20px',
        borderTop: '1px solid #e5e5e5',
        background: '#fafafa',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span style={{ fontSize: '12px', color: '#666' }}>
          Click "Send" to text consent link to patient
        </span>
        {!ghlContactId && (
          <span style={{ fontSize: '12px', color: '#dc2626' }}>
            ⚠️ No GHL contact linked
          </span>
        )}
      </div>
    </div>
  );
}

// ============================================
// HELPER FUNCTIONS
// ============================================
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// ============================================
// TAB BUTTON COMPONENT
// ============================================
function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '12px 20px',
        background: 'transparent',
        border: 'none',
        borderBottom: active ? '2px solid black' : '2px solid transparent',
        color: active ? 'black' : '#666',
        fontWeight: active ? '500' : '400',
        fontSize: '14px',
        cursor: 'pointer'
      }}
    >
      {children}
    </button>
  );
}

// ============================================
// OVERVIEW TAB
// ============================================
function OverviewTab({ patient }) {
  const activeProtocols = patient.protocols?.filter(p => p.status === 'active') || [];
  const totalSpent = patient.purchases?.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0) || 0;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
      {/* Stats */}
      <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '16px' }}>
        <div style={{ flex: 1, background: 'white', borderRadius: '8px', border: '1px solid #e5e5e5', padding: '20px' }}>
          <div style={{ fontSize: '32px', fontWeight: '600' }}>{patient.protocols?.length || 0}</div>
          <div style={{ fontSize: '13px', color: '#666' }}>Total Protocols</div>
        </div>
        <div style={{ flex: 1, background: 'white', borderRadius: '8px', border: '1px solid #e5e5e5', padding: '20px' }}>
          <div style={{ fontSize: '32px', fontWeight: '600', color: '#16a34a' }}>{activeProtocols.length}</div>
          <div style={{ fontSize: '13px', color: '#666' }}>Active</div>
        </div>
        <div style={{ flex: 1, background: 'white', borderRadius: '8px', border: '1px solid #e5e5e5', padding: '20px' }}>
          <div style={{ fontSize: '32px', fontWeight: '600' }}>{patient.purchases?.length || 0}</div>
          <div style={{ fontSize: '13px', color: '#666' }}>Purchases</div>
        </div>
        <div style={{ flex: 1, background: 'white', borderRadius: '8px', border: '1px solid #e5e5e5', padding: '20px' }}>
          <div style={{ fontSize: '32px', fontWeight: '600', color: '#16a34a' }}>{formatCurrency(totalSpent)}</div>
          <div style={{ fontSize: '13px', color: '#666' }}>Total Spent</div>
        </div>
      </div>

      {/* Active Protocols */}
      <div style={{ background: 'white', borderRadius: '8px', border: '1px solid #e5e5e5', padding: '20px' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Active Protocols
        </h3>
        {activeProtocols.length === 0 ? (
          <p style={{ color: '#666', fontSize: '14px' }}>No active protocols</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {activeProtocols.map(p => (
              <div key={p.id} style={{ padding: '12px', background: '#fafafa', borderRadius: '6px' }}>
                <div style={{ fontWeight: '500', fontSize: '14px' }}>{p.program_name || p.program_type}</div>
                {p.peptide_name && <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>{p.peptide_name}</div>}
                <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                  Ends: {formatDate(p.end_date)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Purchases */}
      <div style={{ background: 'white', borderRadius: '8px', border: '1px solid #e5e5e5', padding: '20px' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Recent Purchases
        </h3>
        {!patient.purchases?.length ? (
          <p style={{ color: '#666', fontSize: '14px' }}>No purchases</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {patient.purchases.slice(0, 5).map(p => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span style={{ color: '#333' }}>{p.item_name}</span>
                <span style={{ color: '#666' }}>{formatCurrency(p.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// CONSENTS TAB (uses ConsentCenter)
// ============================================
function ConsentsTab({ patient }) {
  return (
    <ConsentCenter
      patientId={patient.id}
      patientName={patient.name?.split(' ')[0] || 'there'}
      ghlContactId={patient.ghl_contact_id}
      completedConsents={patient.consents || []}
      completedIntakes={patient.intakes || []}
    />
  );
}

// ============================================
// PURCHASES TAB
// ============================================
function PurchasesTab({ purchases = [] }) {
  const totalSpent = purchases.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

  return (
    <div style={{ background: 'white', borderRadius: '8px', border: '1px solid #e5e5e5', overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e5e5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Purchase History</h3>
        <div style={{ fontSize: '14px', color: '#666' }}>
          Total: <span style={{ fontWeight: '600', color: '#16a34a' }}>{formatCurrency(totalSpent)}</span>
        </div>
      </div>
      {purchases.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>No purchases found</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#fafafa' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', color: '#666' }}>Date</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', color: '#666' }}>Category</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', color: '#666' }}>Item</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', color: '#666' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {purchases.map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: '12px 16px', fontSize: '14px' }}>{formatDate(p.purchase_date || p.created_at)}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '500',
                    background: '#f5f5f5',
                    color: '#333'
                  }}>
                    {p.category}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px' }}>{p.item_name}</td>
                <td style={{ padding: '12px 16px', fontSize: '14px', textAlign: 'right', fontWeight: '500' }}>{formatCurrency(p.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ============================================
// PROTOCOLS TAB
// ============================================
function ProtocolsTab({ protocols = [] }) {
  const active = protocols.filter(p => p.status === 'active');
  const completed = protocols.filter(p => p.status === 'completed');
  const other = protocols.filter(p => !['active', 'completed'].includes(p.status));

  const ProtocolCard = ({ protocol }) => {
    const isActive = protocol.status === 'active';
    const today = new Date();
    const endDate = protocol.end_date ? new Date(protocol.end_date) : null;
    const daysLeft = endDate ? Math.max(0, Math.ceil((endDate - today) / (1000 * 60 * 60 * 24))) : null;

    return (
      <div style={{
        padding: '16px',
        background: '#fafafa',
        borderRadius: '8px',
        border: isActive ? '2px solid black' : '1px solid #e5e5e5'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontWeight: '600', fontSize: '15px' }}>{protocol.program_name || protocol.program_type}</div>
            {protocol.peptide_name && (
              <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>{protocol.peptide_name}</div>
            )}
          </div>
          <span style={{
            padding: '4px 10px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: '600',
            textTransform: 'uppercase',
            background: isActive ? '#000' : '#e5e5e5',
            color: isActive ? '#fff' : '#666'
          }}>
            {protocol.status}
          </span>
        </div>
        
        {isActive && daysLeft !== null && (
          <div style={{ marginTop: '12px', display: 'flex', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '24px', fontWeight: '600' }}>{daysLeft}</div>
              <div style={{ fontSize: '11px', color: '#666', textTransform: 'uppercase' }}>Days Left</div>
            </div>
            {protocol.injections_logged !== undefined && (
              <div>
                <div style={{ fontSize: '24px', fontWeight: '600' }}>{protocol.injections_logged || 0}</div>
                <div style={{ fontSize: '11px', color: '#666', textTransform: 'uppercase' }}>Logged</div>
              </div>
            )}
          </div>
        )}
        
        <div style={{ marginTop: '12px', fontSize: '13px', color: '#666' }}>
          {protocol.start_date && <span>Started: {formatDate(protocol.start_date)}</span>}
          {protocol.end_date && <span style={{ marginLeft: '16px' }}>Ends: {formatDate(protocol.end_date)}</span>}
        </div>
      </div>
    );
  };

  return (
    <div>
      {active.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
            Active ({active.length})
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {active.map(p => <ProtocolCard key={p.id} protocol={p} />)}
          </div>
        </div>
      )}

      {completed.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px', color: '#666' }}>
            Completed ({completed.length})
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {completed.map(p => <ProtocolCard key={p.id} protocol={p} />)}
          </div>
        </div>
      )}

      {other.length > 0 && (
        <div>
          <h3 style={{ fontSize: '14px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px', color: '#666' }}>
            Other ({other.length})
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {other.map(p => <ProtocolCard key={p.id} protocol={p} />)}
          </div>
        </div>
      )}

      {protocols.length === 0 && (
        <div style={{ padding: '40px', textAlign: 'center', color: '#666', background: 'white', borderRadius: '8px', border: '1px solid #e5e5e5' }}>
          No protocols found
        </div>
      )}
    </div>
  );
}

// ============================================
// INTAKE TAB
// ============================================
function IntakeTab({ intakes = [] }) {
  if (intakes.length === 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#666', background: 'white', borderRadius: '8px', border: '1px solid #e5e5e5' }}>
        No medical intake form on file
      </div>
    );
  }

  const intake = intakes[0];
  
  // Parse medical conditions if it's a JSON object
  const getMedicalConditions = () => {
    if (!intake.medical_conditions) return 'None reported';
    if (typeof intake.medical_conditions === 'string') return intake.medical_conditions;
    if (typeof intake.medical_conditions === 'object') {
      const conditions = Object.entries(intake.medical_conditions)
        .filter(([key, val]) => val?.response === 'Yes')
        .map(([key, val]) => val?.label || key);
      return conditions.length > 0 ? conditions.join(', ') : 'None reported';
    }
    return 'None reported';
  };

  return (
    <div style={{ background: 'white', borderRadius: '8px', border: '1px solid #e5e5e5', overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e5e5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Medical Intake Form</h3>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#666' }}>Submitted {formatDate(intake.submitted_at)}</p>
        </div>
        {intake.pdf_url && (
          <a href={intake.pdf_url} target="_blank" rel="noopener noreferrer" style={{
            padding: '8px 16px',
            background: '#000',
            color: '#fff',
            borderRadius: '4px',
            fontSize: '13px',
            fontWeight: '500',
            textDecoration: 'none'
          }}>
            View Full PDF
          </a>
        )}
      </div>
      
      <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Basic Info */}
        <div>
          <h4 style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', color: '#666' }}>Basic Info</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
            <div><span style={{ color: '#666' }}>Name:</span> {intake.first_name} {intake.last_name}</div>
            <div><span style={{ color: '#666' }}>DOB:</span> {intake.date_of_birth || intake.dob || '-'}</div>
            <div><span style={{ color: '#666' }}>Gender:</span> {intake.gender || intake.sex || '-'}</div>
            <div><span style={{ color: '#666' }}>Phone:</span> {intake.phone || '-'}</div>
            <div><span style={{ color: '#666' }}>Email:</span> {intake.email || '-'}</div>
          </div>
        </div>

        {/* Address */}
        <div>
          <h4 style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', color: '#666' }}>Address</h4>
          <div style={{ fontSize: '14px' }}>
            {intake.street_address && <div>{intake.street_address}</div>}
            {(intake.city || intake.state || intake.postal_code) && (
              <div>{[intake.city, intake.state, intake.postal_code].filter(Boolean).join(', ')}</div>
            )}
            {!intake.street_address && !intake.city && '-'}
          </div>
        </div>

        {/* Medical Conditions */}
        <div>
          <h4 style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', color: '#666' }}>Medical Conditions</h4>
          <div style={{ fontSize: '14px' }}>{getMedicalConditions()}</div>
        </div>

        {/* Current Medications */}
        <div>
          <h4 style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', color: '#666' }}>Current Medications</h4>
          <div style={{ fontSize: '14px' }}>{intake.current_medications || intake.medications || 'None reported'}</div>
        </div>

        {/* Allergies */}
        <div>
          <h4 style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', color: '#666' }}>Allergies</h4>
          <div style={{ fontSize: '14px' }}>{intake.allergies || (intake.has_allergies === false ? 'No known allergies' : 'None reported')}</div>
        </div>

        {/* What Brings You In */}
        <div>
          <h4 style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', color: '#666' }}>Reason for Visit</h4>
          <div style={{ fontSize: '14px' }}>{intake.what_brings_you_in || intake.what_brings_you || '-'}</div>
        </div>

        {/* Injury Info */}
        {(intake.currently_injured || intake.injured) && (
          <div style={{ gridColumn: '1 / -1' }}>
            <h4 style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', color: '#666' }}>Injury Details</h4>
            <div style={{ fontSize: '14px' }}>
              <div><span style={{ color: '#666' }}>Description:</span> {intake.injury_description || '-'}</div>
              <div><span style={{ color: '#666' }}>Location:</span> {intake.injury_location || '-'}</div>
              <div><span style={{ color: '#666' }}>When:</span> {intake.injury_when_occurred || intake.injury_date || '-'}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================
export default function PatientProfilePage() {
  const router = useRouter();
  const { id } = router.query;
  
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (id) fetchPatient();
  }, [id]);

  const fetchPatient = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try the API endpoint - it should handle both UUID and GHL contact ID
      // First try /api/admin/patient/[id] format
      let res = await fetch(`/api/admin/patient/${id}`);
      
      // If that fails, try /api/admin/patient?id=[id] format
      if (!res.ok) {
        res = await fetch(`/api/admin/patient?id=${id}`);
      }
      
      // If still failing, try with ghl parameter
      if (!res.ok) {
        res = await fetch(`/api/admin/patient?ghl=${id}`);
      }
      
      if (!res.ok) {
        throw new Error('Patient not found');
      }
      
      const data = await res.json();
      
      // Handle different response formats
      if (data.patient) {
        // API returns { patient: {...}, protocols: [...], ... }
        setPatient({
          ...data.patient,
          protocols: data.protocols || [],
          purchases: data.purchases || [],
          intakes: data.intakes || [],
          consents: data.consents || []
        });
      } else if (data.success && data.data) {
        // API returns { success: true, data: {...} }
        setPatient(data.data);
      } else if (data.id || data.name) {
        // API returns patient object directly
        setPatient(data);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Fetch patient error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: '16px', color: '#666' }}>Loading...</div>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', color: '#991b1b', marginBottom: '8px' }}>{error || 'Patient not found'}</div>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>ID: {id}</div>
          <Link href="/admin/patients" style={{ color: '#000', textDecoration: 'underline' }}>← Back to Patients</Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{patient.name} - Range Medical</title>
      </Head>

      <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
        {/* Header */}
        <header style={{ background: 'white', borderBottom: '1px solid #e5e5e5', padding: '16px 24px' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Link href="/admin/patients" style={{ color: '#666', textDecoration: 'none', fontSize: '14px' }}>
              ← Back to Patients
            </Link>
            <div style={{ display: 'flex', gap: '12px' }}>
              {patient.login_token && (
                <a
                  href={`/patient/dashboard?token=${patient.login_token}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: '8px 16px',
                    background: '#f5f5f5',
                    color: '#000',
                    borderRadius: '4px',
                    fontSize: '13px',
                    fontWeight: '500',
                    textDecoration: 'none',
                    border: '1px solid #e5e5e5'
                  }}
                >
                  View Patient Portal
                </a>
              )}
              {patient.ghl_contact_id && (
                <a
                  href={`https://app.gohighlevel.com/v2/location/WICdvbXmTjQORW6GiHWW/contacts/detail/${patient.ghl_contact_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: '8px 16px',
                    background: '#000',
                    color: '#fff',
                    borderRadius: '4px',
                    fontSize: '13px',
                    fontWeight: '500',
                    textDecoration: 'none'
                  }}
                >
                  Open in GHL
                </a>
              )}
            </div>
          </div>
        </header>

        {/* Patient Info */}
        <div style={{ background: 'white', borderBottom: '1px solid #e5e5e5', padding: '24px' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <h1 style={{ margin: '0 0 8px', fontSize: '28px', fontWeight: '600' }}>{patient.name}</h1>
            <div style={{ display: 'flex', gap: '24px', color: '#666', fontSize: '14px' }}>
              {patient.email && <span>📧 {patient.email}</span>}
              {patient.phone && <span>📱 {patient.phone}</span>}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ background: 'white', borderBottom: '1px solid #e5e5e5' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', gap: '0' }}>
            <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>Overview</TabButton>
            <TabButton active={activeTab === 'consents'} onClick={() => setActiveTab('consents')}>
              Consents {patient.consents?.length > 0 && `(${patient.consents.length})`}
            </TabButton>
            <TabButton active={activeTab === 'protocols'} onClick={() => setActiveTab('protocols')}>
              Protocols {patient.protocols?.length > 0 && `(${patient.protocols.length})`}
            </TabButton>
            <TabButton active={activeTab === 'purchases'} onClick={() => setActiveTab('purchases')}>
              Purchases {patient.purchases?.length > 0 && `(${patient.purchases.length})`}
            </TabButton>
            <TabButton active={activeTab === 'intake'} onClick={() => setActiveTab('intake')}>
              Medical Intake {patient.intakes?.length > 0 && '✓'}
            </TabButton>
          </div>
        </div>

        {/* Content */}
        <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
          {activeTab === 'overview' && <OverviewTab patient={patient} />}
          {activeTab === 'consents' && <ConsentsTab patient={patient} />}
          {activeTab === 'protocols' && <ProtocolsTab protocols={patient.protocols} />}
          {activeTab === 'purchases' && <PurchasesTab purchases={patient.purchases} />}
          {activeTab === 'intake' && <IntakeTab intakes={patient.intakes} />}
        </main>
      </div>
    </>
  );
}
