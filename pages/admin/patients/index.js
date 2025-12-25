// /pages/admin/patients/index.js
// Patients List - Clean UI
// Range Medical

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminLayout, { sharedStyles as s } from '../../../components/AdminLayout';

export default function PatientsList() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/patients');
      if (res.ok) {
        const data = await res.json();
        setPatients(data.patients || data || []);
      }
    } catch (err) {
      console.error('Error fetching patients:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(p => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    const fullName = `${p.first_name || ''} ${p.last_name || ''}`.toLowerCase();
    return (
      fullName.includes(searchLower) ||
      p.email?.toLowerCase().includes(searchLower) ||
      p.phone?.includes(search)
    );
  });

  return (
    <AdminLayout title="Patients">
      {/* Header */}
      <div style={s.pageHeader}>
        <h1 style={s.pageTitle}>Patients</h1>
        <p style={s.pageSubtitle}>{filteredPatients.length} patients</p>
      </div>

      {/* Search */}
      <div style={s.filterBar}>
        <input
          type="text"
          placeholder="Search by name, email, or phone..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...s.searchInput, width: '400px' }}
        />
      </div>

      {/* Patients Table */}
      <div style={s.card}>
        {loading ? (
          <div style={s.loading}>Loading...</div>
        ) : filteredPatients.length === 0 ? (
          <div style={s.emptyState}>
            <div style={s.emptyIcon}>👥</div>
            <div style={s.emptyText}>No patients found</div>
          </div>
        ) : (
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Name</th>
                <th style={s.th}>Email</th>
                <th style={s.th}>Phone</th>
                <th style={s.th}>Active Protocols</th>
                <th style={s.th}></th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.slice(0, 100).map(patient => {
                const fullName = `${patient.first_name || ''} ${patient.last_name || ''}`.trim() || 'Unknown';
                const activeCount = patient.active_protocols || 0;
                
                return (
                  <tr
                    key={patient.id || patient.ghl_contact_id}
                    style={s.trHover}
                    onClick={() => window.location.href = `/admin/patients/${patient.ghl_contact_id || patient.id}`}
                  >
                    <td style={s.td}>
                      <div style={{ fontWeight: '500' }}>{fullName}</div>
                    </td>
                    <td style={s.td}>
                      {patient.email || '—'}
                    </td>
                    <td style={s.td}>
                      {patient.phone || '—'}
                    </td>
                    <td style={s.td}>
                      {activeCount > 0 ? (
                        <span style={{ ...s.badge, ...s.badgeActive }}>{activeCount} active</span>
                      ) : (
                        <span style={{ color: '#999' }}>—</span>
                      )}
                    </td>
                    <td style={{ ...s.td, textAlign: 'right' }}>
                      <Link
                        href={`/admin/patients/${patient.ghl_contact_id || patient.id}`}
                        style={{ ...s.btnSecondary, ...s.btnSmall }}
                        onClick={e => e.stopPropagation()}
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
}
