// /pages/admin/utilities.js
// Admin Utilities - Sync purchases from GHL CSV
// Range Medical

import { useState } from 'react';
import Head from 'next/head';
import AdminNav from '../../components/AdminNav';

// Parse CSV
function parseCSV(content) {
  const lines = content.split('\n');
  const headers = parseCSVLine(lines[0]);
  const records = [];
  
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values = parseCSVLine(lines[i]);
    const record = {};
    headers.forEach((h, idx) => {
      record[h] = values[idx] || '';
    });
    records.push(record);
  }
  return records;
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function parseDate(dateStr) {
  if (!dateStr) return null;
  const parsed = new Date(dateStr);
  if (isNaN(parsed.getTime())) return null;
  return parsed.toISOString().split('T')[0];
}

export default function UtilitiesPage() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setResult(null);
    setStatus('');
  };

  const processCSV = async (dryRun = true) => {
    if (!file) {
      setStatus('Please select a CSV file');
      return;
    }

    setLoading(true);
    setStatus(dryRun ? 'Analyzing CSV...' : 'Syncing purchases...');

    try {
      const content = await file.text();
      const records = parseCSV(content);

      // Filter: no calendar, only succeeded
      const valid = records.filter(r => 
        r['Source type'] !== 'calendar' && 
        r['Status'] === 'succeeded'
      );

      const calendarCount = records.filter(r => r['Source type'] === 'calendar').length;

      // Map to purchase format
      const purchases = valid.map(r => ({
        ghl_transaction_id: r['Internal transaction id'],
        ghl_contact_id: r['Customer id'],
        patient_name: r['Customer name'],
        patient_email: r['Customer email'],
        patient_phone: r['Customer phone'],
        item_name: r['Line item name'],
        amount: parseFloat(r['Total amount paid']) || 0,
        list_price: parseFloat(r['Sub total']) || null,
        quantity: parseInt(r['Line item quantity']) || 1,
        source: r['Source type'] || 'ghl',
        purchase_date: parseDate(r['Transaction date']),
        ghl_source_type: r['Source type']
      }));

      // Call sync API
      const res = await fetch('/api/admin/purchases/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purchases, dryRun })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Sync failed');
      }

      setResult({
        ...data,
        csvTotal: records.length,
        calendarSkipped: calendarCount,
        validRecords: valid.length,
        totalAmount: purchases.reduce((sum, p) => sum + p.amount, 0)
      });
      setStatus(dryRun ? 'Analysis complete' : 'Sync complete!');

    } catch (err) {
      setStatus(`Error: ${err.message}`);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const deleteCalendar = async () => {
    if (!confirm('Delete all calendar source transactions from the database?')) {
      return;
    }

    setLoading(true);
    setStatus('Deleting calendar transactions...');

    try {
      const res = await fetch('/api/admin/purchases/sync', {
        method: 'DELETE'
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Delete failed');
      }

      setStatus(`Deleted ${data.deleted} calendar transactions`);
      setResult(null);

    } catch (err) {
      setStatus(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Utilities | Range Medical</title>
      </Head>

      <div style={styles.container}>
        <AdminNav title="Utilities" subtitle="Admin tools" />

        <main style={styles.main}>
          {/* Sync Purchases Card */}
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Sync GHL Purchases</h2>
            <p style={styles.cardDesc}>
              Upload a GHL transactions CSV export to sync purchases. Calendar source transactions are automatically excluded.
            </p>

            <div style={styles.uploadArea}>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                style={styles.fileInput}
                id="csvFile"
              />
              <label htmlFor="csvFile" style={styles.fileLabel}>
                {file ? file.name : 'Choose CSV file...'}
              </label>
            </div>

            <div style={styles.buttonRow}>
              <button
                onClick={() => processCSV(true)}
                disabled={loading || !file}
                style={styles.btnSecondary}
              >
                {loading ? 'Processing...' : 'Analyze (Dry Run)'}
              </button>
              <button
                onClick={() => processCSV(false)}
                disabled={loading || !file}
                style={styles.btnPrimary}
              >
                {loading ? 'Syncing...' : 'Sync Purchases'}
              </button>
            </div>

            {status && (
              <div style={{
                ...styles.status,
                background: status.includes('Error') ? '#fee2e2' : 
                            status.includes('complete') ? '#dcfce7' : '#f5f5f5',
                color: status.includes('Error') ? '#dc2626' : 
                       status.includes('complete') ? '#166534' : '#666'
              }}>
                {status}
              </div>
            )}

            {result && (
              <div style={styles.resultBox}>
                <h3 style={styles.resultTitle}>
                  {result.dryRun ? 'Analysis Results' : 'Sync Results'}
                </h3>
                <div style={styles.resultGrid}>
                  <div style={styles.resultItem}>
                    <div style={styles.resultValue}>{result.csvTotal?.toLocaleString()}</div>
                    <div style={styles.resultLabel}>CSV Records</div>
                  </div>
                  <div style={styles.resultItem}>
                    <div style={styles.resultValue}>{result.calendarSkipped?.toLocaleString()}</div>
                    <div style={styles.resultLabel}>Calendar (Skipped)</div>
                  </div>
                  <div style={styles.resultItem}>
                    <div style={styles.resultValue}>{result.validRecords?.toLocaleString()}</div>
                    <div style={styles.resultLabel}>Valid Records</div>
                  </div>
                  <div style={styles.resultItem}>
                    <div style={styles.resultValue}>${result.totalAmount?.toLocaleString()}</div>
                    <div style={styles.resultLabel}>Total Amount</div>
                  </div>
                </div>
                
                <div style={styles.divider} />
                
                <div style={styles.resultGrid}>
                  <div style={styles.resultItem}>
                    <div style={styles.resultValue}>{result.existing?.toLocaleString()}</div>
                    <div style={styles.resultLabel}>Existing in DB</div>
                  </div>
                  <div style={styles.resultItem}>
                    <div style={{ ...styles.resultValue, color: '#166534' }}>
                      {(result.toInsert || result.inserted || 0).toLocaleString()}
                    </div>
                    <div style={styles.resultLabel}>
                      {result.dryRun ? 'Will Insert' : 'Inserted'}
                    </div>
                  </div>
                  <div style={styles.resultItem}>
                    <div style={styles.resultValue}>{result.duplicates?.toLocaleString() || result.duplicatesSkipped?.toLocaleString() || 0}</div>
                    <div style={styles.resultLabel}>Duplicates</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Delete Calendar Card */}
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Delete Calendar Transactions</h2>
            <p style={styles.cardDesc}>
              Remove any existing calendar source transactions from the database.
            </p>
            <button
              onClick={deleteCalendar}
              disabled={loading}
              style={styles.btnDanger}
            >
              Delete Calendar Transactions
            </button>
          </div>
        </main>
      </div>
    </>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: '#f5f5f5',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  main: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '24px'
  },
  card: {
    background: '#fff',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  cardTitle: {
    margin: '0 0 8px',
    fontSize: '18px',
    fontWeight: '600'
  },
  cardDesc: {
    margin: '0 0 20px',
    fontSize: '14px',
    color: '#666'
  },
  uploadArea: {
    marginBottom: '16px'
  },
  fileInput: {
    display: 'none'
  },
  fileLabel: {
    display: 'block',
    padding: '40px',
    border: '2px dashed #ddd',
    borderRadius: '8px',
    textAlign: 'center',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#666',
    transition: 'border-color 0.2s'
  },
  buttonRow: {
    display: 'flex',
    gap: '12px'
  },
  btnPrimary: {
    padding: '12px 24px',
    background: '#000',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer'
  },
  btnSecondary: {
    padding: '12px 24px',
    background: '#f5f5f5',
    color: '#000',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer'
  },
  btnDanger: {
    padding: '12px 24px',
    background: '#dc2626',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer'
  },
  status: {
    marginTop: '16px',
    padding: '12px 16px',
    borderRadius: '8px',
    fontSize: '14px'
  },
  resultBox: {
    marginTop: '20px',
    padding: '20px',
    background: '#fafafa',
    borderRadius: '8px'
  },
  resultTitle: {
    margin: '0 0 16px',
    fontSize: '14px',
    fontWeight: '600',
    textTransform: 'uppercase',
    color: '#666'
  },
  resultGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px'
  },
  resultItem: {
    textAlign: 'center'
  },
  resultValue: {
    fontSize: '24px',
    fontWeight: '700'
  },
  resultLabel: {
    fontSize: '11px',
    color: '#666',
    marginTop: '4px'
  },
  divider: {
    height: '1px',
    background: '#e5e5e5',
    margin: '16px 0'
  }
};
