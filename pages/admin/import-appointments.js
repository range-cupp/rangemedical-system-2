// /pages/admin/import-appointments.js
// GHL Appointment Import Tool

import { useState } from 'react';
import AdminLayout from '../../components/AdminLayout';

export default function ImportAppointments() {
  const [file, setFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState(null);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  async function handleAnalyze() {
    if (!file) { setError('Please select a CSV file'); return; }
    setAnalyzing(true);
    setError(null);
    setPreview(null);
    setResults(null);
    try {
      const csvData = await file.text();
      const res = await fetch('/api/import/ghl-appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvData, dryRun: true }),
      });
      const data = await res.json();
      if (res.ok) { setPreview(data); } else { setError(data.error || 'Analysis failed'); }
    } catch (err) { setError(err.message); }
    finally { setAnalyzing(false); }
  }

  async function handleImport() {
    if (!file) return;
    setImporting(true);
    setError(null);
    try {
      const csvData = await file.text();
      const res = await fetch('/api/import/ghl-appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvData, dryRun: false }),
      });
      const data = await res.json();
      if (res.ok) { setResults(data); setPreview(null); } else { setError(data.error || 'Import failed'); }
    } catch (err) { setError(err.message); }
    finally { setImporting(false); }
  }

  const data = results || preview;
  const details = data?.details || [];

  function getFiltered() {
    switch (activeTab) {
      case 'matched': return details.filter(d => d.status === 'matched' || d.status === 'imported');
      case 'unmatched': return details.filter(d => d.status === 'unmatched');
      case 'duplicates': return details.filter(d => d.status === 'duplicate');
      case 'errors': return details.filter(d => d.status === 'error' || d.status === 'skipped');
      default: return details;
    }
  }

  const filtered = getFiltered();

  return (
    <AdminLayout title="Import Appointments">
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Import GHL Appointments</h1>
        <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 24 }}>
          Upload a CSV exported from GoHighLevel to import appointments into the system.
        </p>

        {/* Upload Card */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 24, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <input
              type="file"
              accept=".csv"
              onChange={e => { setFile(e.target.files[0]); setPreview(null); setResults(null); setError(null); }}
              style={{ fontSize: 14 }}
            />
            {file && !results && (
              <>
                {!preview ? (
                  <button onClick={handleAnalyze} disabled={analyzing} style={btnStyle('#2563eb')}>
                    {analyzing ? 'Analyzing...' : 'Analyze CSV'}
                  </button>
                ) : (
                  <button onClick={handleImport} disabled={importing} style={btnStyle('#16a34a')}>
                    {importing ? 'Importing...' : `Import ${preview.summary.toImport} Appointments`}
                  </button>
                )}
              </>
            )}
          </div>
          {file && <p style={{ color: '#9ca3af', fontSize: 13, marginTop: 8 }}>{file.name}</p>}
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: 14, color: '#dc2626', fontSize: 14, marginBottom: 20 }}>
            {error}
          </div>
        )}

        {/* Summary */}
        {data?.summary && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 20 }}>
            <StatCard label="Total Rows" value={data.summary.total} color="#374151" />
            <StatCard label="Matched" value={data.summary.matched} color="#16a34a" />
            <StatCard label="Unmatched" value={data.summary.unmatched} color="#f59e0b" />
            <StatCard label="Duplicates" value={data.summary.duplicates} color="#6b7280" />
            <StatCard label="Errors" value={data.summary.errors + (data.summary.skipped || 0)} color="#ef4444" />
            {data.summary.imported != null && (
              <StatCard label="Imported" value={data.summary.imported} color="#2563eb" />
            )}
          </div>
        )}

        {/* Results success message */}
        {results?.success && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: 14, color: '#16a34a', fontSize: 14, marginBottom: 20 }}>
            Successfully imported {results.summary.imported} appointments.
            {results.summary.unmatched > 0 && ` (${results.summary.unmatched} without patient match — they'll show on the calendar but aren't linked to a patient profile.)`}
          </div>
        )}

        {/* Detail Tabs */}
        {details.length > 0 && (
          <>
            <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid #e5e7eb', marginBottom: 16 }}>
              {[
                { key: 'all', label: `All (${details.length})` },
                { key: 'matched', label: `Matched (${details.filter(d => d.status === 'matched' || d.status === 'imported').length})` },
                { key: 'unmatched', label: `Unmatched (${details.filter(d => d.status === 'unmatched').length})` },
                { key: 'duplicates', label: `Duplicates (${details.filter(d => d.status === 'duplicate').length})` },
                { key: 'errors', label: `Errors (${details.filter(d => d.status === 'error' || d.status === 'skipped').length})` },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    padding: '8px 14px', fontSize: 13, fontWeight: activeTab === tab.key ? 600 : 400,
                    color: activeTab === tab.key ? '#2563eb' : '#6b7280', background: 'none', border: 'none',
                    borderBottom: activeTab === tab.key ? '2px solid #2563eb' : '2px solid transparent',
                    cursor: 'pointer',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Table */}
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Patient Name</th>
                    <th style={thStyle}>Service</th>
                    <th style={thStyle}>Date/Time</th>
                    <th style={thStyle}>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 500).map((d, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={tdStyle}>
                        <span style={{
                          display: 'inline-block', padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600,
                          background: statusColors[d.status]?.bg || '#f3f4f6',
                          color: statusColors[d.status]?.text || '#374151',
                        }}>
                          {d.status}
                        </span>
                      </td>
                      <td style={tdStyle}>{d.name}</td>
                      <td style={tdStyle}>{d.mappedService || d.service}</td>
                      <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{d.time}</td>
                      <td style={{ ...tdStyle, color: '#6b7280', fontSize: 12 }}>{d.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length > 500 && (
                <p style={{ padding: 12, color: '#9ca3af', fontSize: 12, textAlign: 'center' }}>
                  Showing first 500 of {filtered.length} rows
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '14px 16px', textAlign: 'center' }}>
      <div style={{ fontSize: 24, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{label}</div>
    </div>
  );
}

function btnStyle(bg) {
  return {
    background: bg, color: '#fff', border: 'none', borderRadius: 8,
    padding: '8px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
  };
}

const thStyle = { padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280' };
const tdStyle = { padding: '8px 12px' };

const statusColors = {
  matched: { bg: '#dcfce7', text: '#16a34a' },
  imported: { bg: '#dbeafe', text: '#2563eb' },
  unmatched: { bg: '#fef3c7', text: '#d97706' },
  duplicate: { bg: '#f3f4f6', text: '#6b7280' },
  error: { bg: '#fef2f2', text: '#dc2626' },
  skipped: { bg: '#f3f4f6', text: '#9ca3af' },
};
