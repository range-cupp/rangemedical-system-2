// /pages/patients/index.js
// Patients List Page - Search and view all patients

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { formatPhone } from '../../lib/format-utils';
import Head from 'next/head';
import Link from 'next/link';

export default function PatientsList() {
  const router = useRouter();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      fetchPatients();
    }, 300);
    return () => clearTimeout(delaySearch);
  }, [search]);

  async function fetchPatients() {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      params.append('limit', '50');

      const res = await fetch(`/api/patients?${params}`);
      const data = await res.json();
      
      if (res.ok) {
        setPatients(data.patients);
        setTotal(data.total);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>Patients | Range Medical</title>
      </Head>
      
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>Patients</h1>
          <div style={styles.searchBox}>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email, or phone..."
              style={styles.searchInput}
            />
          </div>
        </div>

        {loading ? (
          <div style={styles.loading}>Loading patients...</div>
        ) : patients.length === 0 ? (
          <div style={styles.emptyState}>
            {search ? 'No patients found matching your search' : 'No patients yet'}
          </div>
        ) : (
          <>
            <div style={styles.count}>{total} patients</div>
            <div style={styles.table}>
              <div style={styles.tableHeader}>
                <div style={styles.colName}>Name</div>
                <div style={styles.colContact}>Contact</div>
                <div style={styles.colStatus}>Status</div>
              </div>
              {patients.map(patient => (
                <Link 
                  href={`/patients/${patient.id}`} 
                  key={patient.id}
                  style={styles.tableRow}
                >
                  <div style={styles.colName}>
                    <span style={styles.patientName}>
                      {patient.first_name} {patient.last_name}
                    </span>
                  </div>
                  <div style={styles.colContact}>
                    <div style={styles.contactEmail}>{patient.email}</div>
                    <div style={styles.contactPhone}>{formatPhone(patient.phone)}</div>
                  </div>
                  <div style={styles.colStatus}>
                    {patient.pendingNotifications > 0 && (
                      <span style={styles.badge}>
                        ⚠️ {patient.pendingNotifications} pending
                      </span>
                    )}
                    {patient.activeProtocols > 0 && (
                      <span style={styles.protocolBadge}>
                        {patient.activeProtocols} active
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}

const styles = {
  container: {
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '24px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px'
  },
  title: {
    fontSize: '28px',
    fontWeight: '600',
    margin: 0
  },
  searchBox: {
    flex: 1,
    maxWidth: '400px',
    marginLeft: '24px'
  },
  searchInput: {
    width: '100%',
    padding: '10px 16px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    boxSizing: 'border-box'
  },
  loading: {
    textAlign: 'center',
    padding: '48px',
    color: '#666'
  },
  emptyState: {
    textAlign: 'center',
    padding: '48px',
    color: '#666',
    background: '#f9fafb',
    borderRadius: '8px'
  },
  count: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '12px'
  },
  table: {
    background: '#fff',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    overflow: 'hidden'
  },
  tableHeader: {
    display: 'flex',
    padding: '12px 16px',
    background: '#f9fafb',
    borderBottom: '1px solid #e5e7eb',
    fontSize: '12px',
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase'
  },
  tableRow: {
    display: 'flex',
    padding: '16px',
    borderBottom: '1px solid #f3f4f6',
    cursor: 'pointer',
    textDecoration: 'none',
    color: 'inherit',
    transition: 'background 0.15s'
  },
  colName: {
    flex: 2
  },
  colContact: {
    flex: 2
  },
  colStatus: {
    flex: 1,
    display: 'flex',
    gap: '8px',
    justifyContent: 'flex-end',
    alignItems: 'center'
  },
  patientName: {
    fontWeight: '500',
    fontSize: '15px'
  },
  contactEmail: {
    fontSize: '14px'
  },
  contactPhone: {
    fontSize: '13px',
    color: '#666'
  },
  badge: {
    background: '#fef3c7',
    color: '#92400e',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '500'
  },
  protocolBadge: {
    background: '#dcfce7',
    color: '#166534',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '500'
  }
};
