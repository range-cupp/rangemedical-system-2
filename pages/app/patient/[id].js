// /pages/app/patient/[id].js
// Patient quick-view — Range Medical Employee App

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import AppLayout from '../../../components/AppLayout';

export default function AppPatientDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [patient, setPatient] = useState(null);
  const [protocols, setProtocols] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetchPatient();
  }, [id]);

  const fetchPatient = async () => {
    setLoading(true);
    try {
      const [pRes, prRes, logRes] = await Promise.all([
        fetch(`/api/patient/${id}`),
        fetch(`/api/protocols?patient_id=${id}&status=active`),
        fetch(`/api/service-log?patient_id=${id}&limit=5`),
      ]);
      if (pRes.ok) {
        const d = await pRes.json();
        setPatient(d.patient || d);
      }
      if (prRes.ok) {
        const d = await prRes.json();
        setProtocols(d.protocols || d || []);
      }
      if (logRes.ok) {
        const d = await logRes.json();
        setRecentLogs(d.entries || d || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (d) => {
    if (!d) return null;
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <>
      <Head>
        <title>{patient ? `${patient.first_name} ${patient.last_name}` : 'Patient'} — Range Medical</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <link rel="manifest" href="/site.webmanifest" />
      </Head>

      <AppLayout title={patient ? `${patient.first_name} ${patient.last_name}` : 'Patient'}>
        {loading ? (
          <div className="app-spinner" />
        ) : !patient ? (
          <div className="app-empty">Patient not found</div>
        ) : (
          <>
            {/* Action row */}
            <div style={{ display: 'flex', gap: 8, padding: '16px 16px 0' }}>
              {patient.phone && (
                <a
                  href={`tel:${patient.phone}`}
                  style={{ flex: 1, background: '#dbeafe', color: '#1d4ed8', borderRadius: 10, padding: '12px 8px', textAlign: 'center', textDecoration: 'none', fontSize: 13, fontWeight: 700 }}
                >
                  📞 Call
                </a>
              )}
              <button
                onClick={() => router.push(`/app/messages?patient_id=${id}`)}
                style={{ flex: 1, background: '#f0fdf4', color: '#166534', borderRadius: 10, padding: '12px 8px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}
              >
                💬 Message
              </button>
              <button
                onClick={() => window.open(`/patients/${id}`, '_blank')}
                style={{ flex: 1, background: '#f8fafc', color: '#475569', borderRadius: 10, padding: '12px 8px', border: '1px solid #e2e8f0', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}
              >
                📋 Full Profile
              </button>
            </div>

            {/* Patient info card */}
            <div className="app-card" style={{ marginTop: 12 }}>
              <div className="app-card-title">Patient Info</div>
              <InfoRow label="Phone" value={patient.phone} />
              <InfoRow label="Email" value={patient.email} />
              <InfoRow label="DOB" value={patient.date_of_birth ? formatDate(patient.date_of_birth + 'T12:00:00') : null} />
              <InfoRow label="Status" value={patient.status} />
            </div>

            {/* Active protocols */}
            {protocols.length > 0 && (
              <div className="app-card">
                <div className="app-card-title">Active Protocols ({protocols.length})</div>
                {protocols.map((p, i) => (
                  <div
                    key={p.id}
                    className="app-list-item"
                    onClick={() => window.open(`/admin/protocol/${p.id}`, '_blank')}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{p.medication || p.name}</div>
                      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{p.category} · {p.dosage || ''}</div>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
                  </div>
                ))}
              </div>
            )}

            {/* Recent sessions */}
            {recentLogs.length > 0 && (
              <div className="app-card">
                <div className="app-card-title">Recent Sessions</div>
                {recentLogs.map(log => (
                  <div key={log.id} className="app-list-item" style={{ cursor: 'default' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: '#0f172a' }}>{log.category} {log.entry_type}</div>
                      {log.medication && <div style={{ fontSize: 12, color: '#64748b', marginTop: 1 }}>{log.medication}</div>}
                    </div>
                    <div style={{ fontSize: 12, color: '#94a3b8', flexShrink: 0 }}>
                      {log.entry_date ? formatDate(log.entry_date + 'T12:00:00') : ''}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Log session shortcut */}
            <div style={{ padding: '4px 12px 32px' }}>
              <button
                onClick={() => router.push('/app/service-log')}
                style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', background: '#0f172a', color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}
              >
                + Log Session for This Patient
              </button>
            </div>
          </>
        )}
      </AppLayout>
    </>
  );
}

function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
      <span style={{ fontSize: 13, color: '#94a3b8' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 500, color: '#0f172a' }}>{value}</span>
    </div>
  );
}
