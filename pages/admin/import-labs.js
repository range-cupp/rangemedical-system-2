// /pages/admin/import-labs.js
// Lab Import Tool - with duplicate protection and detailed errors

import { useState } from 'react';
import Head from 'next/head';

export default function ImportLabs() {
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // all, imported, duplicates, errors

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

  function getFilteredDetails() {
    if (!results?.details) return [];
    
    switch (activeTab) {
      case 'imported':
        return results.details.filter(d => d.status === 'imported');
      case 'duplicates':
        return results.details.filter(d => d.status === 'duplicate');
      case 'errors':
        return results.details.filter(d => d.status === 'error');
      case 'skipped':
        return results.details.filter(d => d.status === 'skipped');
      default:
        return results.details;
    }
  }

  function getStatusColor(status) {
    switch (status) {
      case 'imported': return '#22c55e';
      case 'duplicate': return '#f59e0b';
      case 'error': return '#ef4444';
      case 'skipped': return '#9ca3af';
      default: return '#666';
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
              onChange={e => {
                setFile(e.target.files[0]);
                setResults(null);
                setError(null);
              }}
              style={styles.fileInput}
              id="csvFile"
            />
            <label htmlFor="csvFile" style={styles.uploadLabel}>
              {file ? `📄 ${file.name}` : '📁 Choose CSV file...'}
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

          <div style={styles.infoBox}>
            <strong>Duplicate Protection:</strong> If you upload the same file twice, 
            previously imported orders will be skipped automatically.
          </div>

          {error && (
            <div style={styles.error}>
              Error: {error}
            </div>
          )}

          {results && (
            <div style={styles.results}>
              <h3 style={styles.resultsTitle}>Import Complete</h3>
              
              <div style={styles.statsRow}>
                <div 
                  style={{...styles.stat, cursor: 'pointer', background: activeTab === 'imported' ? '#f0fdf4' : '#fff'}}
                  onClick={() => setActiveTab('imported')}
                >
                  <div style={{...styles.statNumber, color: '#22c55e'}}>{results.imported}</div>
                  <div style={styles.statLabel}>Imported</div>
                </div>
                <div 
                  style={{...styles.stat, cursor: 'pointer', background: activeTab === 'duplicates' ? '#fffbeb' : '#fff'}}
                  onClick={() => setActiveTab('duplicates')}
                >
                  <div style={{...styles.statNumber, color: '#f59e0b'}}>{results.duplicates}</div>
                  <div style={styles.statLabel}>Duplicates</div>
                </div>
                <div 
                  style={{...styles.stat, cursor: 'pointer', background: activeTab === 'skipped' ? '#f9fafb' : '#fff'}}
                  onClick={() => setActiveTab('skipped')}
                >
                  <div style={{...styles.statNumber, color: '#9ca3af'}}>{results.skipped}</div>
                  <div style={styles.statLabel}>Skipped</div>
                </div>
                <div 
                  style={{...styles.stat, cursor: 'pointer', background: activeTab === 'errors' ? '#fef2f2' : '#fff'}}
                  onClick={() => setActiveTab('errors')}
                >
                  <div style={{...styles.statNumber, color: '#ef4444'}}>{results.errors}</div>
                  <div style={styles.statLabel}>Errors</div>
                </div>
              </div>

              {/* Tab buttons */}
              <div style={styles.tabs}>
                <button 
                  style={{...styles.tab, background: activeTab === 'all' ? '#000' : '#fff', color: activeTab === 'all' ? '#fff' : '#000'}}
                  onClick={() => setActiveTab('all')}
                >
                  All ({results.details?.length || 0})
                </button>
                <button 
                  style={{...styles.tab, background: activeTab === 'imported' ? '#000' : '#fff', color: activeTab === 'imported' ? '#fff' : '#000'}}
                  onClick={() => setActiveTab('imported')}
                >
                  Imported
                </button>
                <button 
                  style={{...styles.tab, background: activeTab === 'duplicates' ? '#000' : '#fff', color: activeTab === 'duplicates' ? '#fff' : '#000'}}
                  onClick={() => setActiveTab('duplicates')}
                >
                  Duplicates
                </button>
                <button 
                  style={{...styles.tab, background: activeTab === 'errors' ? '#000' : '#fff', color: activeTab === 'errors' ? '#fff' : '#000'}}
                  onClick={() => setActiveTab('errors')}
                >
                  Errors
                </button>
              </div>

              {/* Details list */}
              <div style={styles.detailsList}>
                <div style={styles.scrollArea}>
                  {getFilteredDetails().length === 0 ? (
                    <div style={styles.emptyState}>No items in this category</div>
                  ) : (
                    getFilteredDetails().slice(0, 100).map((item, idx) => (
                      <div key={idx} style={styles.detailItem}>
                        <div style={styles.detailLeft}>
                          <span style={styles.detailName}>{item.name}</span>
                          {item.date && <span style={styles.detailDate}>{item.date}</span>}
                        </div>
                        <div style={styles.detailRight}>
                          <span style={{
                            ...styles.statusBadge,
                            background: getStatusColor(item.status) + '20',
                            color: getStatusColor(item.status)
                          }}>
                            {item.status}
                          </span>
                          {item.reason && (
                            <span style={styles.detailReason}>{item.reason}</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                  {getFilteredDetails().length > 100 && (
                    <div style={styles.moreText}>
                      ...and {getFilteredDetails().length - 100} more
                    </div>
                  )}
                </div>
              </div>

              {/* Error details section */}
              {results.errorDetails && results.errorDetails.length > 0 && (
                <div style={styles.errorSection}>
                  <h4 style={styles.errorSectionTitle}>Error Details</h4>
                  <div style={styles.scrollArea}>
                    {results.errorDetails.map((err, idx) => (
                      <div key={idx} style={styles.errorItem}>
                        <strong>{err.name}</strong> ({err.email})
                        <div style={styles.errorMessage}>{err.error}</div>
                      </div>
                    ))}
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
    maxWidth: '800px',
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
    transition: 'border-color 0.15s',
    fontSize: '15px'
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
  infoBox: {
    marginTop: '16px',
    padding: '12px',
    background: '#f0f9ff',
    borderRadius: '8px',
    fontSize: '13px',
    color: '#0369a1'
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
    gap: '12px',
    marginBottom: '16px'
  },
  stat: {
    flex: 1,
    textAlign: 'center',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #e5e7eb'
  },
  statNumber: {
    fontSize: '24px',
    fontWeight: '700'
  },
  statLabel: {
    fontSize: '12px',
    color: '#666'
  },
  tabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '16px'
  },
  tab: {
    padding: '8px 16px',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500'
  },
  detailsList: {
    borderTop: '1px solid #e5e7eb',
    paddingTop: '16px'
  },
  scrollArea: {
    maxHeight: '300px',
    overflowY: 'auto'
  },
  emptyState: {
    textAlign: 'center',
    padding: '24px',
    color: '#999'
  },
  detailItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '10px 0',
    borderBottom: '1px solid #f3f4f6'
  },
  detailLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  detailName: {
    fontWeight: '500',
    fontSize: '14px'
  },
  detailDate: {
    fontSize: '12px',
    color: '#666'
  },
  detailRight: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '4px'
  },
  statusBadge: {
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase'
  },
  detailReason: {
    fontSize: '11px',
    color: '#666',
    maxWidth: '200px',
    textAlign: 'right'
  },
  moreText: {
    textAlign: 'center',
    padding: '8px',
    color: '#666',
    fontSize: '13px'
  },
  errorSection: {
    marginTop: '16px',
    padding: '16px',
    background: '#fef2f2',
    borderRadius: '8px'
  },
  errorSectionTitle: {
    margin: '0 0 12px 0',
    color: '#dc2626',
    fontSize: '14px'
  },
  errorItem: {
    padding: '8px 0',
    borderBottom: '1px solid #fecaca',
    fontSize: '13px'
  },
  errorMessage: {
    color: '#dc2626',
    fontSize: '12px',
    marginTop: '4px'
  },
  link: {
    color: '#000',
    fontWeight: '500'
  }
};
