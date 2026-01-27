// /pages/admin/fix-names.js
// Fix patient names by pulling from GHL
// Range Medical

import { useState } from 'react';
import Head from 'next/head';

export default function FixNames() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const runCheck = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/fix-patient-names');
      const data = await res.json();
      setResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const runFix = async (dryRun) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/fix-patient-names', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dryRun })
      });
      const data = await res.json();
      setResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Fix Patient Names | Range Medical</title>
      </Head>

      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.title}>🔧 Fix Patient Names</h1>
          <p style={styles.subtitle}>
            Find patients with bad names (email prefixes, "Unknown", etc.) and fix them by pulling correct names from GHL.
          </p>

          <div style={styles.buttons}>
            <button onClick={runCheck} disabled={loading} style={styles.checkBtn}>
              {loading ? '⏳ Loading...' : '🔍 Check for Bad Names'}
            </button>
            <button onClick={() => runFix(true)} disabled={loading} style={styles.previewBtn}>
              {loading ? '⏳ Loading...' : '👁️ Preview Fix'}
            </button>
            <button 
              onClick={() => {
                if (confirm('This will update patient names in the database. Continue?')) {
                  runFix(false);
                }
              }} 
              disabled={loading} 
              style={styles.fixBtn}
            >
              {loading ? '⏳ Loading...' : '✅ Fix Names'}
            </button>
          </div>

          {error && <div style={styles.error}>❌ {error}</div>}

          {results && (
            <div style={styles.results}>
              {results.total !== undefined && (
                <div style={styles.stats}>
                  <div style={styles.stat}>
                    <div style={styles.statValue}>{results.total}</div>
                    <div style={styles.statLabel}>Total Patients</div>
                  </div>
                  <div style={styles.stat}>
                    <div style={styles.statValue}>{results.badNames}</div>
                    <div style={styles.statLabel}>Bad Names</div>
                  </div>
                  <div style={styles.stat}>
                    <div style={styles.statValue}>{results.fixableViaGHL}</div>
                    <div style={styles.statLabel}>Can Auto-Fix</div>
                  </div>
                  <div style={styles.stat}>
                    <div style={styles.statValue}>{results.needsManualFix}</div>
                    <div style={styles.statLabel}>Needs Manual Fix</div>
                  </div>
                </div>
              )}

              {results.results && (
                <div style={styles.fixResults}>
                  <h3>{results.dryRun ? '👁️ Preview' : '✅ Fixed'}: {results.results.fixed} names</h3>
                  {results.results.failed > 0 && (
                    <p style={{ color: '#dc2626' }}>Failed: {results.results.failed}</p>
                  )}
                </div>
              )}

              {results.patients && results.patients.length > 0 && (
                <div style={styles.table}>
                  <h3>Patients with Bad Names:</h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                        <th style={styles.th}>Current Name</th>
                        <th style={styles.th}>Email</th>
                        <th style={styles.th}>Phone</th>
                        <th style={styles.th}>Has GHL ID</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.patients.slice(0, 50).map((p, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td style={styles.td}>{p.currentName}</td>
                          <td style={styles.td}>{p.email || '-'}</td>
                          <td style={styles.td}>{p.phone || '-'}</td>
                          <td style={styles.td}>{p.canAutoFix ? '✅' : '❌'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {results.patients.length > 50 && (
                    <p style={{ color: '#6b7280', marginTop: '8px' }}>
                      Showing 50 of {results.patients.length}
                    </p>
                  )}
                </div>
              )}

              {results.results?.details && results.results.details.length > 0 && (
                <div style={styles.table}>
                  <h3>Name Changes:</h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                        <th style={styles.th}>Old Name</th>
                        <th style={styles.th}>→</th>
                        <th style={styles.th}>New Name</th>
                        <th style={styles.th}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.results.details.map((d, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td style={styles.td}>{d.oldName}</td>
                          <td style={styles.td}>→</td>
                          <td style={styles.td}>{d.newName || '-'}</td>
                          <td style={styles.td}>{d.error || '✅'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

const styles = {
  container: {
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    background: '#f8f9fa',
    minHeight: '100vh',
    padding: '40px 20px',
    display: 'flex',
    justifyContent: 'center'
  },
  card: {
    background: 'white',
    borderRadius: '16px',
    padding: '32px',
    maxWidth: '900px',
    width: '100%',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
  },
  title: { margin: '0 0 8px 0', fontSize: '24px', fontWeight: '700' },
  subtitle: { margin: '0 0 24px 0', color: '#6b7280', fontSize: '14px' },
  buttons: { display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' },
  checkBtn: {
    padding: '12px 20px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    background: 'white',
    cursor: 'pointer',
    fontWeight: '600'
  },
  previewBtn: {
    padding: '12px 20px',
    border: '2px solid #3b82f6',
    borderRadius: '8px',
    background: '#eff6ff',
    color: '#1d4ed8',
    cursor: 'pointer',
    fontWeight: '600'
  },
  fixBtn: {
    padding: '12px 20px',
    border: 'none',
    borderRadius: '8px',
    background: '#111',
    color: 'white',
    cursor: 'pointer',
    fontWeight: '600'
  },
  error: {
    background: '#fef2f2',
    border: '1px solid #fecaca',
    color: '#dc2626',
    padding: '16px',
    borderRadius: '8px',
    marginBottom: '16px'
  },
  results: { marginTop: '24px' },
  stats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '12px',
    marginBottom: '24px'
  },
  stat: {
    background: '#f9fafb',
    padding: '16px',
    borderRadius: '8px',
    textAlign: 'center'
  },
  statValue: { fontSize: '28px', fontWeight: '700' },
  statLabel: { fontSize: '12px', color: '#6b7280', marginTop: '4px' },
  fixResults: {
    background: '#f0fdf4',
    padding: '16px',
    borderRadius: '8px',
    marginBottom: '16px'
  },
  table: { marginTop: '16px' },
  th: { textAlign: 'left', padding: '8px', fontWeight: '600' },
  td: { padding: '8px' }
};
