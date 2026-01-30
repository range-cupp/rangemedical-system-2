// /pages/admin/patients.js
// Patients List - Range Medical
// Clean aesthetic matching Pipeline

import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function PatientsList() {
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPatients, setFilteredPatients] = useState([]);

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredPatients(patients);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredPatients(
        patients.filter(p => 
          (p.first_name?.toLowerCase() || '').includes(term) ||
          (p.last_name?.toLowerCase() || '').includes(term) ||
          (p.name?.toLowerCase() || '').includes(term) ||
          (p.email?.toLowerCase() || '').includes(term) ||
          (p.phone || '').includes(term)
        )
      );
    }
  }, [searchTerm, patients]);

  const fetchPatients = async () => {
    try {
      const res = await fetch('/api/admin/patients?limit=1000');
      if (res.ok) {
        const data = await res.json();
        // Handle both array response and object with patients property
        const patientList = Array.isArray(data) ? data : (data.patients || []);
        setPatients(patientList);
        setFilteredPatients(patientList);
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDisplayName = (patient) => {
    if (patient.first_name && patient.last_name) {
      return `${patient.first_name} ${patient.last_name}`;
    }
    return patient.name || patient.email || 'Unknown';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return <div style={styles.loading}>Loading patients...</div>;
  }

  return (
    <>
      <Head>
        <title>Patients | Range Medical</title>
      </Head>

      <div style={styles.container}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Patients</h1>
            <div style={styles.subtitle}>{filteredPatients.length} patients</div>
          </div>
          <div style={styles.navLinks}>
            <Link href="/admin/pipeline" style={styles.navLink}>
              ← Pipeline
            </Link>
          </div>
        </div>

        {/* Search */}
        <div style={styles.searchContainer}>
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        {/* Patient List */}
        {filteredPatients.length === 0 ? (
          <div style={styles.emptyState}>
            {searchTerm ? 'No patients match your search' : 'No patients found'}
          </div>
        ) : (
          <div style={styles.list}>
            {filteredPatients.map(patient => (
              <Link 
                key={patient.id} 
                href={`/patients/${patient.id}`}
                style={{ textDecoration: 'none' }}
              >
                <div style={styles.card}>
                  <div style={styles.cardMain}>
                    <div style={styles.patientName}>{getDisplayName(patient)}</div>
                    <div style={styles.patientMeta}>
                      {patient.email && <span>{patient.email}</span>}
                      {patient.phone && <span> • {patient.phone}</span>}
                    </div>
                    {patient.created_at && (
                      <div style={styles.patientDate}>
                        Added {formatDate(patient.created_at)}
                      </div>
                    )}
                  </div>
                  <div style={styles.cardArrow}>→</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

const styles = {
  container: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '24px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  loading: {
    textAlign: 'center',
    padding: '48px',
    color: '#666'
  },
  header: {
    marginBottom: '24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  title: {
    fontSize: '28px',
    fontWeight: '600',
    margin: 0
  },
  subtitle: {
    fontSize: '14px',
    color: '#666',
    marginTop: '4px'
  },
  navLinks: {
    display: 'flex',
    gap: '16px'
  },
  navLink: {
    color: '#000',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '500',
    padding: '8px 16px',
    border: '1px solid #e5e7eb',
    borderRadius: '6px'
  },
  searchContainer: {
    marginBottom: '24px'
  },
  searchInput: {
    width: '100%',
    maxWidth: '400px',
    padding: '12px 16px',
    fontSize: '14px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    outline: 'none',
    boxSizing: 'border-box'
  },
  emptyState: {
    textAlign: 'center',
    padding: '48px',
    color: '#9ca3af',
    background: '#f9fafb',
    borderRadius: '8px',
    border: '1px solid #e5e7eb'
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  card: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'border-color 0.2s'
  },
  cardMain: {
    flex: 1
  },
  patientName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#000',
    marginBottom: '4px'
  },
  patientMeta: {
    fontSize: '14px',
    color: '#666'
  },
  patientDate: {
    fontSize: '13px',
    color: '#9ca3af',
    marginTop: '4px'
  },
  cardArrow: {
    fontSize: '18px',
    color: '#9ca3af',
    marginLeft: '16px'
  }
};
