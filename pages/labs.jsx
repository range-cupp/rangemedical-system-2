// pages/labs.jsx
// Standalone Lab Results Dashboard with patient search
import { useState, useRef } from 'react';
import AdminLayout from '../components/AdminLayout';
import LabDashboard from '../components/labs/LabDashboard';

export default function LabsPage() {
  const [patientSearch, setPatientSearch] = useState('');
  const [patientResults, setPatientResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const searchTimer = useRef(null);

  const handlePatientSearch = (query) => {
    setPatientSearch(query);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (query.length < 2) {
      setPatientResults([]);
      return;
    }

    searchTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/patients?search=${encodeURIComponent(query)}`);
        const json = await res.json();
        setPatientResults(json.patients || json.data || []);
      } catch (err) {
        console.error('Patient search error:', err);
      }
    }, 300);
  };

  const selectPatient = (patient) => {
    setSelectedPatient(patient);
    setPatientSearch('');
    setPatientResults([]);
  };

  return (
    <AdminLayout title="Lab Results">
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Patient Search */}
        <div style={{ marginBottom: '24px' }}>
          {selectedPatient ? (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '12px 16px', background: '#F3F4F6', borderRadius: '8px'
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>
                  {selectedPatient.first_name || ''} {selectedPatient.last_name || selectedPatient.name || ''}
                </div>
                {selectedPatient.email && (
                  <div style={{ fontSize: '0.8125rem', color: '#6B7280' }}>{selectedPatient.email}</div>
                )}
              </div>
              <button
                onClick={() => setSelectedPatient(null)}
                style={{
                  padding: '6px 12px', border: '1px solid #D1D5DB', borderRadius: '6px',
                  background: '#FFF', cursor: 'pointer', fontSize: '0.8125rem'
                }}
              >
                Change Patient
              </button>
            </div>
          ) : (
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Search for a patient..."
                value={patientSearch}
                onChange={(e) => handlePatientSearch(e.target.value)}
                style={{
                  width: '100%', padding: '12px 16px', border: '1px solid #D1D5DB',
                  borderRadius: '8px', fontSize: '0.9375rem', outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              {patientResults.length > 0 && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
                  background: '#FFF', border: '1px solid #D1D5DB', borderRadius: '0 0 8px 8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)', maxHeight: '300px', overflowY: 'auto'
                }}>
                  {patientResults.map(p => (
                    <div
                      key={p.id}
                      onClick={() => selectPatient(p)}
                      style={{
                        padding: '10px 16px', cursor: 'pointer',
                        borderBottom: '1px solid #F3F4F6',
                        transition: 'background 0.1s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
                      onMouseLeave={e => e.currentTarget.style.background = '#FFF'}
                    >
                      <div style={{ fontWeight: 500 }}>
                        {p.first_name || ''} {p.last_name || p.name || ''}
                      </div>
                      {p.email && (
                        <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>{p.email}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Dashboard */}
        {selectedPatient ? (
          <LabDashboard
            patientId={selectedPatient.id}
            patientGender={selectedPatient.gender}
            embedded={false}
          />
        ) : (
          <div style={{
            textAlign: 'center', padding: '64px 24px', color: '#6B7280'
          }}>
            Search for a patient above to view their lab results.
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
