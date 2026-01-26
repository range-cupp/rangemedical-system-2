// /pages/admin/backfill-labs.js
// Simple UI to backfill lab appointments from GHL
// Range Medical

import { useState } from 'react';
import Head from 'next/head';

export default function BackfillLabs() {
  const [startDate, setStartDate] = useState('2025-01-01');
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const runBackfill = async (dryRun) => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const res = await fetch('/api/admin/backfill-lab-appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate, endDate, dryRun })
      });

      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || 'Something went wrong');
      } else {
        setResults(data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Backfill Lab Appointments | Range Medical</title>
      </Head>

      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.title}>🩸 Backfill Lab Appointments</h1>
          <p style={styles.subtitle}>
            Pull historical appointments from GHL calendars into the Labs Pipeline
          </p>

          <div style={styles.calendars}>
            <div style={styles.calendarItem}>📅 New Patient Blood Draw</div>
            <div style={styles.calendarItem}>📅 Follow-up Blood Draw</div>
            <div style={styles.calendarItem}>📅 Initial Lab Review</div>
          </div>

          <div style={styles.form}>
            <div style={styles.row}>
              <div style={styles.field}>
                <label>Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={styles.input}
                />
              </div>
              <div style={styles.field}>
                <label>End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.buttons}>
              <button
                onClick={() => runBackfill(true)}
                disabled={loading}
                style={styles.previewBtn}
              >
                {loading ? '⏳ Loading...' : '👁️ Preview (Dry Run)'}
              </button>
              <button
                onClick={() => {
                  if (confirm('This will import appointments into the Labs Pipeline. Continue?')) {
                    runBackfill(false);
                  }
                }}
                disabled={loading}
                style={styles.importBtn}
              >
                {loading ? '⏳ Loading...' : '✅ Import for Real'}
              </button>
            </div>
          </div>

          {error && (
            <div style={styles.error}>
              ❌ {error}
            </div>
          )}

          {results && (
            <div style={styles.results}>
              <h3 style={styles.resultsTitle}>
                {results.summary?.dryRun ? '👁️ Preview Results' : '✅ Import Complete'}
              </h3>

              <div style={styles.stats}>
                <div style={styles.stat}>
                  <div style={styles.statValue}>{results.summary?.counts?.newPatientBloodDraw || 0}</div>
                  <div style={styles.statLabel}>New Patient Blood Draws</div>
                </div>
                <div style={styles.stat}>
                  <div style={styles.statValue}>{results.summary?.counts?.followUpBloodDraw || 0}</div>
                  <div style={styles.statLabel}>Follow-up Blood Draws</div>
                </div>
                <div style={styles.stat}>
                  <div style={styles.statValue}>{results.summary?.counts?.labReview || 0}</div>
                  <div style={styles.statLabel}>Lab Reviews</div>
                </div>
              </div>

              {!results.summary?.dryRun && (
                <div style={styles.created}>
                  <strong>Created:</strong> {results.summary?.created?.journeys || 0} journeys, {results.summary?.created?.followUps || 0} follow-ups
                </div>
              )}

              {results.summary?.errors?.length > 0 && (
                <div style={styles.errors}>
                  <strong>Errors:</strong>
                  <ul>
                    {results.summary.errors.map((err, i) => (
                      <li key={i}>{err.type}: {err.error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {results.details && (
                <details style={styles.details}>
                  <summary style={styles.detailsSummary}>View All Appointments Found</summary>
                  
                  {results.details.newPatientBloodDraw?.length > 0 && (
                    <>
                      <h4>New Patient Blood Draws ({results.details.newPatientBloodDraw.length})</h4>
                      <table style={styles.table}>
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Date</th>
                            <th>Status</th>
                            <th>Stage</th>
                          </tr>
                        </thead>
                        <tbody>
                          {results.details.newPatientBloodDraw.map((appt, i) => (
                            <tr key={i}>
                              <td>{appt.contact_name}</td>
                              <td>{new Date(appt.date).toLocaleDateString()}</td>
                              <td>{appt.status || '-'}</td>
                              <td>{appt.stage}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </>
                  )}

                  {results.details.followUpBloodDraw?.length > 0 && (
                    <>
                      <h4>Follow-up Blood Draws ({results.details.followUpBloodDraw.length})</h4>
                      <table style={styles.table}>
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Date</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {results.details.followUpBloodDraw.map((appt, i) => (
                            <tr key={i}>
                              <td>{appt.contact_name}</td>
                              <td>{new Date(appt.date).toLocaleDateString()}</td>
                              <td>{appt.status || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </>
                  )}

                  {results.details.labReview?.length > 0 && (
                    <>
                      <h4>Lab Reviews ({results.details.labReview.length})</h4>
                      <table style={styles.table}>
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Date</th>
                            <th>Completed</th>
                          </tr>
                        </thead>
                        <tbody>
                          {results.details.labReview.map((appt, i) => (
                            <tr key={i}>
                              <td>{appt.contact_name}</td>
                              <td>{new Date(appt.date).toLocaleDateString()}</td>
                              <td>{appt.completed ? '✅' : '⏳'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </>
                  )}
                </details>
              )}

              {!results.summary?.dryRun && (
                <a href="/admin/pipeline?view=labs" style={styles.viewPipelineBtn}>
                  → View Labs Pipeline
                </a>
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
    maxWidth: '800px',
    width: '100%',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
  },
  title: {
    margin: '0 0 8px 0',
    fontSize: '24px',
    fontWeight: '700'
  },
  subtitle: {
    margin: '0 0 24px 0',
    color: '#6b7280',
    fontSize: '14px'
  },
  calendars: {
    display: 'flex',
    gap: '12px',
    marginBottom: '24px',
    flexWrap: 'wrap'
  },
  calendarItem: {
    background: '#f3f4f6',
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '13px',
    color: '#374151'
  },
  form: {
    marginBottom: '24px'
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    marginBottom: '20px'
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  input: {
    padding: '10px 12px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px'
  },
  buttons: {
    display: 'flex',
    gap: '12px'
  },
  previewBtn: {
    flex: 1,
    padding: '14px 20px',
    border: '2px solid #e5e7eb',
    background: 'white',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  importBtn: {
    flex: 1,
    padding: '14px 20px',
    border: 'none',
    background: '#111',
    color: 'white',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  error: {
    background: '#fef2f2',
    border: '1px solid #fecaca',
    color: '#dc2626',
    padding: '16px',
    borderRadius: '8px',
    marginBottom: '16px'
  },
  results: {
    background: '#f9fafb',
    borderRadius: '12px',
    padding: '20px'
  },
  resultsTitle: {
    margin: '0 0 16px 0',
    fontSize: '16px'
  },
  stats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px',
    marginBottom: '16px'
  },
  stat: {
    background: 'white',
    padding: '16px',
    borderRadius: '8px',
    textAlign: 'center'
  },
  statValue: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#111'
  },
  statLabel: {
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '4px'
  },
  created: {
    background: '#f0fdf4',
    padding: '12px 16px',
    borderRadius: '8px',
    color: '#166534',
    marginBottom: '16px'
  },
  errors: {
    background: '#fef2f2',
    padding: '12px 16px',
    borderRadius: '8px',
    color: '#dc2626',
    marginBottom: '16px'
  },
  details: {
    marginTop: '16px'
  },
  detailsSummary: {
    cursor: 'pointer',
    fontWeight: '600',
    padding: '8px 0'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '8px',
    marginBottom: '16px',
    fontSize: '13px'
  },
  viewPipelineBtn: {
    display: 'inline-block',
    marginTop: '16px',
    padding: '12px 20px',
    background: '#2563eb',
    color: 'white',
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: '600'
  }
};
