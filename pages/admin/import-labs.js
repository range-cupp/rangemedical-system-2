// /pages/admin/import-labs.js
// Lab Import Tool - Upload CSV files to import historical labs

import { useState } from 'react';
import Head from 'next/head';

export default function ImportLabs() {
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  async function handleImport() {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setImporting(true);
    setError(null);
    setResults(null);

    try {
      const csvData = await file.text();
      
      const res = await fetch('/api/import/accessmedlabs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvData })
      });

      const data = await res.json();

      if (res.ok) {
        setResults(data);
      } else {
        setError(data.error || 'Import failed');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setImporting(false);
    }
  }

  return (
    <>
      <Head>
        <title>Import Labs | Range Medical</title>
      </Head>

      <div style={styles.container}>
        <h1 style={styles.title}>Import Lab Results</h1>
        <p style={styles.subtitle}>Upload CSV files from AccessMedLabs or other providers</p>

        <div style={styles.card}>
          <h2 style={styles.cardTitle}>AccessMedLabs CSV Import</h2>
          
          <div style={styles.uploadArea}>
            <input
              type="file"
              accept=".csv"
              onChange={e => setFile(e.target.files[0])}
              style={styles.fileInput}
              id="csvFile"
            />
            <label htmlFor="csvFile" style={styles.uploadLabel}>
              {file ? file.name : 'Choose CSV file...'}
            </label>
          </div>

          <button
            onClick={handleImport}
            disabled={!file || importing}
            style={{
              ...styles.button,
              opacity: (!file || importing) ? 0.5 : 1
            }}
          >
            {importing ? 'Importing...' : 'Import Labs'}
          </button>

          {error && (
            <div style={styles.error}>
              Error: {error}
            </div>
          )}

          {results && (
            <div style={styles.results}>
              <h3 style={styles.resultsTitle}>Import Complete</h3>
              <div style={styles.statsRow}>
                <div style={styles.stat}>
                  <div style={styles.statNumber}>{results.imported}</div>
                  <div style={styles.statLabel}>Imported</div>
                </div>
                <div style={styles.stat}>
                  <div style={{...styles.statNumber, color: '#f59e0b'}}>{results.skipped}</div>
                  <div style={styles.statLabel}>Skipped</div>
                </div>
                <div style={styles.stat}>
                  <div style={{...styles.statNumber, color: '#ef4444'}}>{results.errors}</div>
                  <div style={styles.statLabel}>Errors</div>
                </div>
              </div>

              {results.details && results.details.length > 0 && (
                <div style={styles.detailsList}>
                  <h4>Details:</h4>
                  <div style={styles.scrollArea}>
                    {results.details.slice(0, 50).map((item, idx) => (
                      <div key={idx} style={styles.detailItem}>
                        <span>{item.name}</span>
                        <span style={{
                          color: item.error ? '#ef4444' : '#22c55e'
                        }}>
                          {item.error || `${item.date} ✓`}
                        </span>
                      </div>
                    ))}
                    {results.details.length > 50 && (
                      <div style={styles.moreText}>
                        ...and {results.details.length - 50} more
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Manual Lab Entry</h2>
          <p style={styles.cardText}>
            For PDFs or individual entries, go to the patient profile and click "+ Add" on Baseline Labs.
          </p>
          <a href="/patients" style={styles.link}>Go to Patients →</a>
        </div>
      </div>
    </>
  );
}

const styles = {
  container: {
    maxWidth: '700px',
    margin: '0 auto',
    padding: '24px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  title: {
    fontSize: '28px',
    fontWeight: '600',
    margin: '0 0 8px 0'
  },
  subtitle: {
    color: '#666',
    marginBottom: '32px'
  },
  card: {
    background: '#fff',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  cardTitle: {
    fontSize: '18px',
    fontWeight: '600',
    marginTop: 0,
    marginBottom: '16px'
  },
  cardText: {
    color: '#666',
    marginBottom: '12px'
  },
  uploadArea: {
    marginBottom: '16px'
  },
  fileInput: {
    display: 'none'
  },
  uploadLabel: {
    display: 'block',
    padding: '32px',
    border: '2px dashed #e5e7eb',
    borderRadius: '8px',
    textAlign: 'center',
    cursor: 'pointer',
    color: '#666',
    transition: 'border-color 0.15s'
  },
  button: {
    width: '100%',
    padding: '14px',
    background: '#000',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '500',
    cursor: 'pointer'
  },
  error: {
    marginTop: '16px',
    padding: '12px',
    background: '#fee2e2',
    color: '#dc2626',
    borderRadius: '8px'
  },
  results: {
    marginTop: '24px',
    padding: '16px',
    background: '#f9fafb',
    borderRadius: '8px'
  },
  resultsTitle: {
    margin: '0 0 16px 0',
    fontSize: '16px'
  },
  statsRow: {
    display: 'flex',
    gap: '24px',
    marginBottom: '16px'
  },
  stat: {
    textAlign: 'center'
  },
  statNumber: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#22c55e'
  },
  statLabel: {
    fontSize: '13px',
    color: '#666'
  },
  detailsList: {
    borderTop: '1px solid #e5e7eb',
    paddingTop: '16px'
  },
  scrollArea: {
    maxHeight: '200px',
    overflowY: 'auto'
  },
  detailItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid #f3f4f6',
    fontSize: '13px'
  },
  moreText: {
    textAlign: 'center',
    padding: '8px',
    color: '#666',
    fontSize: '13px'
  },
  link: {
    color: '#000',
    fontWeight: '500'
  }
};
