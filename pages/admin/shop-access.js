// /pages/admin/shop-access.js
// Issue or reset peptide vial shop credentials for a patient.
// Calls the existing /api/admin/shop-account endpoint, which auto-emails + SMSes the credentials.

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import AdminLayout, { sharedStyles } from '../../components/AdminLayout';
import { useAuth } from '../../components/AuthProvider';

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/Los_Angeles' });
}

export default function ShopAccessAdmin() {
  const { session } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [loadingList, setLoadingList] = useState(true);

  const [patientSearch, setPatientSearch] = useState('');
  const [patientResults, setPatientResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const searchTimer = useRef(null);

  const [issuing, setIssuing] = useState(false);
  const [issueError, setIssueError] = useState(null);
  const [lastIssued, setLastIssued] = useState(null); // { username, password, patient }

  const authHeaders = useCallback(() => ({
    Authorization: `Bearer ${session?.access_token}`,
    'Content-Type': 'application/json',
  }), [session]);

  const loadAccounts = useCallback(async () => {
    if (!session?.access_token) return;
    setLoadingList(true);
    try {
      const res = await fetch('/api/admin/shop-account', { headers: authHeaders() });
      const data = await res.json();
      setAccounts(data.accounts || []);
    } catch (err) {
      console.error('Failed to load shop accounts:', err);
    } finally {
      setLoadingList(false);
    }
  }, [session, authHeaders]);

  useEffect(() => { loadAccounts(); }, [loadAccounts]);

  // Debounced patient search
  useEffect(() => {
    if (!patientSearch || patientSearch.length < 2) {
      setPatientResults([]);
      return;
    }
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/patients/search?q=${encodeURIComponent(patientSearch)}`);
        const data = await res.json();
        setPatientResults(data.patients || []);
      } catch (err) {
        console.error('Patient search error:', err);
      }
      setSearching(false);
    }, 300);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [patientSearch]);

  const handleIssue = async () => {
    if (!selectedPatient) return;
    setIssuing(true);
    setIssueError(null);
    setLastIssued(null);
    try {
      const res = await fetch('/api/admin/shop-account', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ patientId: selectedPatient.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to issue credentials');
      setLastIssued({ ...data, patient: selectedPatient });
      await loadAccounts();
    } catch (err) {
      setIssueError(err.message);
    } finally {
      setIssuing(false);
    }
  };

  const existingAccount = accounts.find(a => a.patient_id === selectedPatient?.id);

  return (
    <AdminLayout title="Shop Access">
      <div style={{ maxWidth: 920 }}>
        <p style={sharedStyles.pageSubtitle}>
          Issue or reset peptide vial shop credentials. The patient automatically receives the username and password by email and SMS.
        </p>

        {/* Issue / Reset card */}
        <div style={{ ...sharedStyles.card, marginTop: 24 }}>
          <div style={sharedStyles.cardHeader}>
            <h2 style={sharedStyles.cardTitle}>Issue or Reset Credentials</h2>
          </div>
          <div style={sharedStyles.cardBody}>
            {/* Patient picker */}
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#666', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Patient
            </label>

            {!selectedPatient ? (
              <>
                <input
                  type="text"
                  value={patientSearch}
                  onChange={e => setPatientSearch(e.target.value)}
                  placeholder="Type a name to search…"
                  autoFocus
                  style={{ width: '100%', padding: '12px 14px', border: '1px solid #d1d1d1', borderRadius: 0, fontSize: 15, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }}
                />
                {patientSearch.length >= 2 && (
                  <div style={{ marginTop: 8, background: '#fff', border: '1px solid #e5e5e5', maxHeight: 360, overflowY: 'auto' }}>
                    {searching && <div style={{ padding: 14, color: '#999', fontSize: 14 }}>Searching…</div>}
                    {!searching && patientResults.length === 0 && (
                      <div style={{ padding: 14, color: '#999', fontSize: 14 }}>No patients found.</div>
                    )}
                    {!searching && patientResults.length > 0 && (
                      <div style={{ padding: '8px 14px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, color: '#999', borderBottom: '1px solid #f0f0f0', background: '#fafafa' }}>
                        {patientResults.length} {patientResults.length === 1 ? 'match' : 'matches'}
                      </div>
                    )}
                    {patientResults.map(p => {
                      const acct = accounts.find(a => a.patient_id === p.id);
                      return (
                        <button
                          key={p.id}
                          onClick={() => { setSelectedPatient(p); setPatientSearch(''); setPatientResults([]); }}
                          style={{ width: '100%', textAlign: 'left', padding: '12px 14px', background: '#fff', border: 'none', borderBottom: '1px solid #f0f0f0', cursor: 'pointer', fontFamily: 'inherit' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#f8f8f8'}
                          onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ fontSize: 15, fontWeight: 600, color: '#111' }}>{p.name}</div>
                              <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>
                                {p.email || 'No email'} · {p.phone || 'No phone'}
                              </div>
                            </div>
                            {acct && (
                              <span style={{ fontSize: 11, fontWeight: 600, color: '#15803d', background: '#f0fdf4', padding: '3px 8px', whiteSpace: 'nowrap' }}>
                                HAS ACCESS
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <div style={{ background: '#f8f8f8', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{selectedPatient.name}</div>
                  <div style={{ fontSize: 13, color: '#666' }}>
                    {selectedPatient.email || 'No email'} · {selectedPatient.phone || 'No phone'}
                  </div>
                </div>
                <button
                  onClick={() => { setSelectedPatient(null); setLastIssued(null); setIssueError(null); }}
                  style={{ background: 'none', border: 'none', color: '#666', fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Change
                </button>
              </div>
            )}

            {selectedPatient && (
              <>
                <div style={{ marginTop: 16, fontSize: 13, color: '#666', lineHeight: 1.6 }}>
                  {existingAccount ? (
                    <>
                      <strong>Existing account:</strong> <code style={{ background: '#f5f5f5', padding: '2px 6px' }}>{existingAccount.username}</code>
                      {' — '}last login {formatDate(existingAccount.last_login_at)}.
                      <br />
                      Clicking Reset will <strong>generate a new password</strong> and resend credentials. The username stays the same.
                    </>
                  ) : (
                    <>No shop account yet. Clicking Issue will generate a new username + password and send them to the patient by email and SMS.</>
                  )}
                </div>

                {!selectedPatient.email && !selectedPatient.phone && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '10px 14px', fontSize: 13, marginTop: 12 }}>
                    Patient has no email or phone on file. Credentials will be generated but cannot be auto-delivered. Copy them from this page after creation.
                  </div>
                )}

                <button
                  onClick={handleIssue}
                  disabled={issuing}
                  style={{ ...sharedStyles.btnPrimary, marginTop: 16, opacity: issuing ? 0.6 : 1, cursor: issuing ? 'not-allowed' : 'pointer' }}
                >
                  {issuing ? 'Working…' : existingAccount ? 'Reset Password' : 'Issue Credentials'}
                </button>

                {issueError && (
                  <div style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 14px', fontSize: 14, marginTop: 12 }}>
                    {issueError}
                  </div>
                )}
              </>
            )}

            {/* Result panel */}
            {lastIssued && (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '16px 20px', marginTop: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#15803d', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
                  Credentials Issued
                </div>
                <div style={{ fontSize: 14, color: '#333', marginBottom: 12 }}>
                  Sent to <strong>{lastIssued.patient.name}</strong>
                  {lastIssued.patient.email && <> at {lastIssued.patient.email}</>}
                  {lastIssued.patient.phone && <> and {lastIssued.patient.phone}</>}.
                </div>
                <div style={{ background: '#fff', padding: '12px 16px', fontSize: 14, fontFamily: 'ui-monospace, SFMono-Regular, monospace' }}>
                  <div><strong>Username:</strong> {lastIssued.username}</div>
                  <div><strong>Password:</strong> {lastIssued.password}</div>
                </div>
                <p style={{ fontSize: 12, color: '#666', marginTop: 10, marginBottom: 0 }}>
                  This password is shown only once. If you need to share it again, reset it.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Existing accounts list */}
        <div style={{ ...sharedStyles.card, marginTop: 24 }}>
          <div style={sharedStyles.cardHeader}>
            <h2 style={sharedStyles.cardTitle}>Active Shop Accounts</h2>
            <span style={{ fontSize: 13, color: '#666' }}>{accounts.length} total</span>
          </div>
          <div>
            {loadingList ? (
              <div style={{ padding: 24, color: '#666' }}>Loading…</div>
            ) : accounts.length === 0 ? (
              <div style={{ padding: 24, color: '#666' }}>No shop accounts yet.</div>
            ) : (
              <table style={sharedStyles.table}>
                <thead>
                  <tr>
                    <th style={sharedStyles.th}>Patient</th>
                    <th style={sharedStyles.th}>Username</th>
                    <th style={sharedStyles.th}>Last Login</th>
                    <th style={sharedStyles.th}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map(a => (
                    <tr key={a.id}>
                      <td style={sharedStyles.td}>
                        {a.patients ? (
                          <Link href={`/patients/${a.patients.id}`} style={{ color: '#000', fontWeight: 500 }}>
                            {a.patients.name}
                          </Link>
                        ) : '—'}
                        <div style={{ fontSize: 12, color: '#999' }}>
                          {a.patients?.email || '—'}
                        </div>
                      </td>
                      <td style={sharedStyles.td}>
                        <code style={{ background: '#f5f5f5', padding: '2px 6px', fontSize: 13 }}>{a.username}</code>
                      </td>
                      <td style={sharedStyles.td}>{formatDate(a.last_login_at)}</td>
                      <td style={sharedStyles.td}>
                        <span style={{
                          fontSize: 12, fontWeight: 600,
                          color: a.is_active ? '#15803d' : '#999',
                          background: a.is_active ? '#f0fdf4' : '#f5f5f5',
                          padding: '2px 8px',
                        }}>
                          {a.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
