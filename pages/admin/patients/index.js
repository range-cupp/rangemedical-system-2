// /pages/admin/patients/index.js
// Patients List - Clean UI
// Range Medical

import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import AdminNav from '../../../components/AdminNav';

export default function PatientsPage() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const res = await fetch('/api/admin/patients');
      if (res.ok) {
        const data = await res.json();
        setPatients(data.patients || data || []);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter patients by search
  const filtered = patients.filter(p => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      (p.name || '').toLowerCase().includes(s) ||
      (p.email || '').toLowerCase().includes(s) ||
      (p.phone || '').toLowerCase().includes(s)
    );
  });

  return (
    <>
      <Head>
        <title>Patients | Range Medical</title>
      </Head>

      <div style={styles.container}>
        <AdminNav title="Patients" subtitle={`${patients.length} patients`} />

        <main style={styles.main}>
          {/* Search */}
          <div style={styles.toolbar}>
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={styles.searchInput}
            />
          </div>

          {/* Table */}
          <div style={styles.tableCard}>
            {loading ? (
              <div style={styles.loading}>Loading patients...</div>
            ) : filtered.length === 0 ? (
              <div style={styles.empty}>No patients found</div>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Name</th>
                    <th style={styles.th}>Phone</th>
                    <th style={styles.th}>Email</th>
                    <th style={styles.th}>Protocols</th>
                    <th style={styles.th}>Purchases</th>
                    <th style={styles.th}></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(patient => (
                    <tr key={patient.id || patient.ghl_contact_id} style={styles.tr}>
                      <td style={styles.td}>
                        <div style={styles.name}>{patient.name || 'Unknown'}</div>
                      </td>
                      <td style={styles.td}>
                        {patient.phone ? (
                          <a href={`tel:${patient.phone}`} style={styles.link}>{patient.phone}</a>
                        ) : '—'}
                      </td>
                      <td style={styles.td}>
                        {patient.email ? (
                          <a href={`mailto:${patient.email}`} style={styles.link}>{patient.email}</a>
                        ) : '—'}
                      </td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.badge,
                          background: patient.protocol_count > 0 ? '#dcfce7' : '#f5f5f5',
                          color: patient.protocol_count > 0 ? '#166534' : '#666'
                        }}>
                          {patient.protocol_count || 0}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.badge}>
                          {patient.purchase_count || 0}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <Link
                          href={`/admin/patient/${patient.ghl_contact_id || patient.id}`}
                          style={styles.viewBtn}
                        >
                          View →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
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
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '24px'
  },
  toolbar: {
    marginBottom: '16px'
  },
  searchInput: {
    width: '100%',
    maxWidth: '400px',
    padding: '10px 14px',
    border: '1px solid #e5e5e5',
    borderRadius: '8px',
    fontSize: '14px',
    background: '#fff'
  },
  tableCard: {
    background: '#fff',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  loading: {
    padding: '40px',
    textAlign: 'center',
    color: '#666'
  },
  empty: {
    padding: '40px',
    textAlign: 'center',
    color: '#666'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  th: {
    textAlign: 'left',
    padding: '12px 16px',
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
    color: '#666',
    borderBottom: '1px solid #e5e5e5',
    background: '#fafafa'
  },
  tr: {
    borderBottom: '1px solid #f0f0f0'
  },
  td: {
    padding: '12px 16px',
    fontSize: '14px'
  },
  name: {
    fontWeight: '500'
  },
  link: {
    color: '#2563eb',
    textDecoration: 'none'
  },
  badge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '10px',
    fontSize: '12px',
    fontWeight: '500',
    background: '#f5f5f5',
    color: '#666'
  },
  viewBtn: {
    padding: '6px 12px',
    background: '#000',
    color: '#fff',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '500',
    textDecoration: 'none'
  }
};
