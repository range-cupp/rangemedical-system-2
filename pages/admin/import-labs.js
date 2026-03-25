// /pages/admin/import-labs.js
// Lab Import Tool — AccessMedLabs CSV + Primex PDF batch importer

import { useState } from 'react';
import AdminLayout from '../../components/AdminLayout';

// ── Shared helpers ────────────────────────────────────────────────────────────

function getStatusColor(status) {
  switch (status) {
    case 'imported': return '#22c55e';
    case 'duplicate': return '#f59e0b';
    case 'error': return '#ef4444';
    case 'skipped': return '#9ca3af';
    case 'not_found': return '#8b5cf6';
    default: return '#666';
  }
}

function ResultsPanel({ results, getItems, tabs }) {
  const [activeTab, setActiveTab] = useState('all');
  const items = getItems(activeTab);

  return (
    <div style={styles.results}>
      <h3 style={styles.resultsTitle}>Import Complete</h3>

      <div style={styles.statsRow}>
        {tabs.map(t => (
          <div
            key={t.key}
            style={{ ...styles.stat, cursor: 'pointer', background: activeTab === t.key ? t.bg : '#fff' }}
            onClick={() => setActiveTab(t.key)}
          >
            <div style={{ ...styles.statNumber, color: t.color }}>{t.count}</div>
            <div style={styles.statLabel}>{t.label}</div>
          </div>
        ))}
      </div>

      <div style={styles.tabBar}>
        <button
          style={{ ...styles.tab, background: activeTab === 'all' ? '#000' : '#fff', color: activeTab === 'all' ? '#fff' : '#000' }}
          onClick={() => setActiveTab('all')}
        >All ({results.total || 0})</button>
        {tabs.map(t => (
          <button
            key={t.key}
            style={{ ...styles.tab, background: activeTab === t.key ? '#000' : '#fff', color: activeTab === t.key ? '#fff' : '#000' }}
            onClick={() => setActiveTab(t.key)}
          >{t.label}</button>
        ))}
      </div>

      <div style={styles.detailsList}>
        <div style={styles.scrollArea}>
          {items.length === 0 ? (
            <div style={styles.emptyState}>No items in this category</div>
          ) : (
            items.slice(0, 100).map((item, idx) => (
              <div key={idx} style={styles.detailItem}>
                <div style={styles.detailLeft}>
                  <span style={styles.detailName}>{item.name}</span>
                  {(item.date || item.matched_name) && (
                    <span style={styles.detailDate}>
                      {item.date}{item.matched_name ? ` · matched: ${item.matched_name}` : ''}
                    </span>
                  )}
                </div>
                <div style={styles.detailRight}>
                  <span style={{ ...styles.statusBadge, background: getStatusColor(item.status) + '20', color: getStatusColor(item.status) }}>
                    {item.status}
                  </span>
                  {item.message && <span style={styles.detailReason}>{item.message}</span>}
                  {item.reason && <span style={styles.detailReason}>{item.reason}</span>}
                  {item.biomarker_count > 0 && item.status === 'imported' && (
                    <span style={styles.detailReason}>{item.biomarker_count} biomarkers</span>
                  )}
                </div>
              </div>
            ))
          )}
          {items.length > 100 && (
            <div style={styles.moreText}>...and {items.length - 100} more</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── AccessMedLabs CSV section ─────────────────────────────────────────────────

function AccessMedLabsSection() {
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  async function handleImport() {
    if (!file) { setError('Please select a file first'); return; }
    setImporting(true); setError(null); setResults(null);
    try {
      const csvData = await file.text();
      const res = await fetch('/api/import/accessmedlabs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvData }),
      });
      const data = await res.json();
      if (res.ok) setResults(data);
      else setError(data.error || 'Import failed');
    } catch (err) {
      setError(err.message);
    } finally {
      setImporting(false);
    }
  }

  const tabs = results ? [
    { key: 'imported',   label: 'Imported',   count: results.imported   || 0, color: '#22c55e', bg: '#f0fdf4' },
    { key: 'duplicates', label: 'Duplicates', count: results.duplicates || 0, color: '#f59e0b', bg: '#fffbeb' },
    { key: 'skipped',    label: 'Skipped',    count: results.skipped    || 0, color: '#9ca3af', bg: '#f9fafb' },
    { key: 'errors',     label: 'Errors',     count: results.errors     || 0, color: '#ef4444', bg: '#fef2f2' },
  ] : [];

  function getItems(tab) {
    if (!results?.details) return [];
    if (tab === 'all') return results.details;
    if (tab === 'duplicates') return results.details.filter(d => d.status === 'duplicate');
    return results.details.filter(d => d.status === tab.replace('s',''));
  }

  return (
    <div style={styles.card}>
      <h2 style={styles.cardTitle}>AccessMedLabs CSV Import</h2>
      <div style={styles.uploadArea}>
        <input type="file" accept=".csv" id="csvFile" style={styles.fileInput}
          onChange={e => { setFile(e.target.files[0]); setResults(null); setError(null); }} />
        <label htmlFor="csvFile" style={styles.uploadLabel}>
          {file ? `📄 ${file.name}` : '📁 Choose CSV file...'}
        </label>
      </div>
      <button onClick={handleImport} disabled={!file || importing}
        style={{ ...styles.button, opacity: (!file || importing) ? 0.5 : 1 }}>
        {importing ? 'Importing...' : 'Import Labs'}
      </button>
      <div style={styles.infoBox}>
        <strong>Duplicate Protection:</strong> Previously imported orders are skipped automatically.
      </div>
      {error && <div style={styles.error}>Error: {error}</div>}
      {results && (
        <ResultsPanel results={results} tabs={tabs} getItems={getItems} />
      )}
    </div>
  );
}

// ── Primex PDF section ────────────────────────────────────────────────────────

function PrimexSection() {
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState('');

  async function handleImport() {
    if (!file) { setError('Please select a PDF first'); return; }
    setImporting(true); setError(null); setResults(null);
    try {
      setProgress('Reading PDF...');
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
      const base64 = btoa(binary);

      setProgress(`Uploading ${(file.size / 1024).toFixed(0)} KB and processing patients...`);
      const res = await fetch('/api/import/primex-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdfBase64: base64, fileName: file.name }),
      });
      const data = await res.json();
      setProgress('');
      if (res.ok) setResults(data);
      else setError(data.error || 'Import failed');
    } catch (err) {
      setProgress('');
      setError(err.message);
    } finally {
      setImporting(false);
    }
  }

  const tabs = results ? [
    { key: 'imported',   label: 'Imported',   count: results.summary?.imported   || 0, color: '#22c55e', bg: '#f0fdf4' },
    { key: 'duplicate',  label: 'Duplicates', count: results.summary?.duplicates || 0, color: '#f59e0b', bg: '#fffbeb' },
    { key: 'not_found',  label: 'Not Found',  count: results.summary?.not_found  || 0, color: '#8b5cf6', bg: '#f5f3ff' },
    { key: 'skipped',    label: 'Skipped',    count: results.summary?.skipped    || 0, color: '#9ca3af', bg: '#f9fafb' },
    { key: 'error',      label: 'Errors',     count: results.summary?.errors     || 0, color: '#ef4444', bg: '#fef2f2' },
  ] : [];

  function getItems(tab) {
    if (!results?.results) return [];
    if (tab === 'all') return results.results;
    return results.results.filter(r => r.status === tab);
  }

  const summaryResults = results ? {
    total: results.summary?.total || 0,
    ...results.summary,
  } : null;

  return (
    <div style={{ ...styles.card, borderTop: '3px solid #6366f1' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
        <h2 style={{ ...styles.cardTitle, margin: 0 }}>Primex PDF Import</h2>
        <span style={styles.newBadge}>RECOMMENDED</span>
      </div>
      <p style={styles.cardText}>
        Upload a multi-patient Primex batch PDF. Lab values are extracted automatically,
        patients are matched by name, and individual PDFs are saved to each patient's file.
      </p>

      <div style={styles.uploadArea}>
        <input type="file" accept=".pdf" id="primexPdf" style={styles.fileInput}
          onChange={e => { setFile(e.target.files[0]); setResults(null); setError(null); setProgress(''); }} />
        <label htmlFor="primexPdf" style={{ ...styles.uploadLabel, borderColor: '#6366f1' }}>
          {file ? `📋 ${file.name} (${(file.size / 1024).toFixed(0)} KB)` : '📋 Choose Primex PDF...'}
        </label>
      </div>

      <button onClick={handleImport} disabled={!file || importing}
        style={{ ...styles.button, background: '#6366f1', opacity: (!file || importing) ? 0.5 : 1 }}>
        {importing ? (progress || 'Processing...') : 'Import Primex PDF'}
      </button>

      <div style={styles.infoBox}>
        <strong>What this does:</strong> Parses all patients from the PDF, extracts lab values,
        matches patients by name, skips duplicates, and saves the original PDF to each patient's file.
      </div>

      {importing && progress && (
        <div style={styles.progressBar}>
          <div style={styles.progressDot} />
          {progress}
        </div>
      )}

      {error && <div style={styles.error}>Error: {error}</div>}

      {results && summaryResults && (
        <ResultsPanel results={summaryResults} tabs={tabs} getItems={getItems} />
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ImportLabs() {
  return (
    <AdminLayout title="Import Labs">
      <h1 style={styles.title}>Import Lab Results</h1>
      <p style={styles.subtitle}>Upload lab data from Primex (PDF) or AccessMedLabs (CSV)</p>

      <PrimexSection />
      <AccessMedLabsSection />

      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Manual Lab Entry</h2>
        <p style={styles.cardText}>
          For individual entries, go to the patient profile and click "+ Add" on Baseline Labs.
        </p>
        <a href="/patients" style={styles.link}>Go to Patients →</a>
      </div>
    </AdminLayout>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = {
  title: { fontSize: '28px', fontWeight: '600', margin: '0 0 8px 0' },
  subtitle: { color: '#666', marginBottom: '32px' },
  card: {
    background: '#fff', borderRadius: 0, padding: '24px',
    marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  cardTitle: { fontSize: '18px', fontWeight: '600', marginTop: 0, marginBottom: '16px' },
  cardText: { color: '#666', marginBottom: '16px', fontSize: '14px' },
  newBadge: {
    fontSize: '10px', fontWeight: '700', letterSpacing: '0.05em',
    background: '#ede9fe', color: '#6366f1', padding: '2px 8px', borderRadius: 0
  },
  uploadArea: { marginBottom: '16px' },
  fileInput: { display: 'none' },
  uploadLabel: {
    display: 'block', padding: '32px', border: '2px dashed #e5e7eb',
    borderRadius: 0, textAlign: 'center', cursor: 'pointer',
    color: '#666', fontSize: '15px', transition: 'border-color 0.15s'
  },
  button: {
    width: '100%', padding: '14px', background: '#000', color: '#fff',
    border: 'none', borderRadius: 0, fontSize: '16px', fontWeight: '500', cursor: 'pointer'
  },
  infoBox: {
    marginTop: '16px', padding: '12px', background: '#f0f9ff',
    borderRadius: 0, fontSize: '13px', color: '#0369a1'
  },
  progressBar: {
    display: 'flex', alignItems: 'center', gap: '8px',
    marginTop: '12px', padding: '10px', background: '#f5f3ff',
    borderRadius: 0, fontSize: '13px', color: '#6366f1'
  },
  progressDot: {
    width: '8px', height: '8px', borderRadius: '50%',
    background: '#6366f1', animation: 'pulse 1.5s infinite'
  },
  error: {
    marginTop: '16px', padding: '12px',
    background: '#fee2e2', color: '#dc2626', borderRadius: 0
  },
  results: {
    marginTop: '24px', padding: '16px', background: '#f9fafb', borderRadius: 0
  },
  resultsTitle: { margin: '0 0 16px 0', fontSize: '16px' },
  statsRow: { display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' },
  stat: {
    flex: 1, minWidth: '80px', textAlign: 'center', padding: '12px',
    borderRadius: 0, border: '1px solid #e5e7eb'
  },
  statNumber: { fontSize: '24px', fontWeight: '700' },
  statLabel: { fontSize: '12px', color: '#666' },
  tabBar: { display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' },
  tab: {
    padding: '8px 16px', border: '1px solid #e5e7eb',
    borderRadius: 0, cursor: 'pointer', fontSize: '13px', fontWeight: '500'
  },
  detailsList: { borderTop: '1px solid #e5e7eb', paddingTop: '16px' },
  scrollArea: { maxHeight: '320px', overflowY: 'auto' },
  emptyState: { textAlign: 'center', padding: '24px', color: '#999' },
  detailItem: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    padding: '10px 0', borderBottom: '1px solid #f3f4f6'
  },
  detailLeft: { display: 'flex', flexDirection: 'column', gap: '2px' },
  detailName: { fontWeight: '500', fontSize: '14px' },
  detailDate: { fontSize: '12px', color: '#666' },
  detailRight: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' },
  statusBadge: {
    padding: '2px 8px', borderRadius: 0,
    fontSize: '11px', fontWeight: '600', textTransform: 'uppercase'
  },
  detailReason: { fontSize: '11px', color: '#666', maxWidth: '220px', textAlign: 'right' },
  moreText: { textAlign: 'center', padding: '8px', color: '#666', fontSize: '13px' },
  link: { color: '#000', fontWeight: '500' },
};
