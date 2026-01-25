// pages/tracker/dashboard.jsx
import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import Link from 'next/link';

export default function CellularEnergyDashboard() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedPatient, setExpandedPatient] = useState(null);
  const [patientCheckins, setPatientCheckins] = useState({});

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const res = await fetch('/api/cellular-energy/patients');
      const data = await res.json();
      setPatients(data.patients || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientCheckins = async (patientId) => {
    if (patientCheckins[patientId]) return; // Already loaded
    
    try {
      const res = await fetch(`/api/cellular-energy/checkin?patient_id=${patientId}`);
      const data = await res.json();
      setPatientCheckins(prev => ({
        ...prev,
        [patientId]: data.checkins || []
      }));
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleExpand = (patientId) => {
    if (expandedPatient === patientId) {
      setExpandedPatient(null);
    } else {
      setExpandedPatient(patientId);
      fetchPatientCheckins(patientId);
    }
  };

  const calculateImprovement = (checkins) => {
    if (!checkins || checkins.length < 2) return null;
    const week1 = checkins.find(c => c.week_number === 1);
    const latest = checkins[checkins.length - 1];
    if (!week1 || !latest) return null;
    
    return {
      energy: latest.energy_level - week1.energy_level,
      sleep: latest.sleep_quality - week1.sleep_quality,
      recovery: latest.recovery - week1.recovery,
      clarity: latest.mental_clarity - week1.mental_clarity
    };
  };

  if (loading) {
    return (
      <Layout>
        <div style={{ padding: '3rem', textAlign: 'center' }}>Loading...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <style jsx>{`
        .dashboard-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem 1rem;
        }
        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }
        .dashboard-header h1 {
          font-size: 1.75rem;
          font-weight: 700;
        }
        .add-btn {
          padding: 0.75rem 1.5rem;
          background: #1a2f4a;
          color: #fff;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          text-decoration: none;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }
        .stat-card {
          background: #fff;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          padding: 1.5rem;
          text-align: center;
        }
        .stat-value {
          font-size: 2rem;
          font-weight: 700;
          color: #1a2f4a;
        }
        .stat-label {
          color: #666;
          font-size: 0.875rem;
        }
        .patient-table {
          background: #fff;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          overflow: hidden;
        }
        .patient-row {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr 1fr auto;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid #e5e5e5;
          align-items: center;
          cursor: pointer;
          transition: background 0.2s;
        }
        .patient-row:hover {
          background: #f9fafb;
        }
        .patient-row.header {
          background: #f3f4f6;
          font-weight: 600;
          font-size: 0.875rem;
          color: #666;
          cursor: default;
        }
        .patient-row.header:hover {
          background: #f3f4f6;
        }
        .patient-name {
          font-weight: 600;
        }
        .progress-mini {
          display: flex;
          gap: 4px;
        }
        .progress-dot {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #e5e5e5;
        }
        .progress-dot.completed {
          background: #16a34a;
        }
        .progress-dot.current {
          background: #1a2f4a;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .sessions-count {
          font-size: 0.875rem;
        }
        .expand-icon {
          font-size: 1.25rem;
          color: #666;
        }
        .expanded-content {
          padding: 1.5rem;
          background: #f9fafb;
          border-bottom: 1px solid #e5e5e5;
        }
        .checkins-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 1rem;
          margin-bottom: 1rem;
        }
        .checkin-card {
          background: #fff;
          border: 1px solid #e5e5e5;
          border-radius: 8px;
          padding: 1rem;
          text-align: center;
        }
        .checkin-card.empty {
          opacity: 0.5;
        }
        .checkin-week {
          font-weight: 600;
          margin-bottom: 0.5rem;
        }
        .checkin-metric {
          font-size: 0.75rem;
          margin-bottom: 0.25rem;
        }
        .checkin-metric span {
          font-weight: 600;
        }
        .improvement {
          display: inline-block;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 600;
        }
        .improvement.positive {
          background: #dcfce7;
          color: #166534;
        }
        .improvement.negative {
          background: #fee2e2;
          color: #991b1b;
        }
        .improvement.neutral {
          background: #f3f4f6;
          color: #666;
        }
        .no-patients {
          text-align: center;
          padding: 3rem;
          color: #666;
        }
        .export-btn {
          padding: 0.5rem 1rem;
          background: #fff;
          border: 1px solid #d4d4d4;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.875rem;
        }
        .export-btn:hover {
          background: #f9fafb;
        }
      `}</style>

      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Cellular Energy Dashboard</h1>
          <Link href="/tracker" className="add-btn">
            + New Check-in
          </Link>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{patients.length}</div>
            <div className="stat-label">Active Patients</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">
              {patients.reduce((sum, p) => sum + (p.total_rlt_sessions || 0), 0)}
            </div>
            <div className="stat-label">Total RLT Sessions</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">
              {patients.reduce((sum, p) => sum + (p.total_hbot_sessions || 0), 0)}
            </div>
            <div className="stat-label">Total HBOT Sessions</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">
              {Math.round(patients.reduce((sum, p) => sum + (p.weeks_completed || 0), 0) / Math.max(1, patients.length) * 10) / 10}
            </div>
            <div className="stat-label">Avg Weeks Completed</div>
          </div>
        </div>

        {/* Patient Table */}
        {patients.length === 0 ? (
          <div className="patient-table">
            <div className="no-patients">
              <p>No active Cellular Energy Reset patients.</p>
            </div>
          </div>
        ) : (
          <div className="patient-table">
            <div className="patient-row header">
              <div>Patient</div>
              <div>Week</div>
              <div>Progress</div>
              <div>RLT</div>
              <div>HBOT</div>
              <div></div>
            </div>
            
            {patients.map(patient => (
              <div key={patient.patient_id}>
                <div 
                  className="patient-row"
                  onClick={() => handleExpand(patient.patient_id)}
                >
                  <div className="patient-name">
                    {patient.first_name} {patient.last_name}
                  </div>
                  <div>Week {patient.current_week || 1}</div>
                  <div className="progress-mini">
                    {[1, 2, 3, 4, 5, 6].map(week => (
                      <div 
                        key={week}
                        className={`progress-dot ${
                          week < (patient.current_week || 1) ? 'completed' : 
                          week === (patient.current_week || 1) ? 'current' : ''
                        }`}
                      />
                    ))}
                  </div>
                  <div className="sessions-count">{patient.total_rlt_sessions || 0}/18</div>
                  <div className="sessions-count">{patient.total_hbot_sessions || 0}/18</div>
                  <div className="expand-icon">
                    {expandedPatient === patient.patient_id ? '▲' : '▼'}
                  </div>
                </div>

                {expandedPatient === patient.patient_id && (
                  <div className="expanded-content">
                    <div className="checkins-grid">
                      {[1, 2, 3, 4, 5, 6].map(week => {
                        const checkin = (patientCheckins[patient.patient_id] || [])
                          .find(c => c.week_number === week);
                        
                        return (
                          <div 
                            key={week} 
                            className={`checkin-card ${!checkin ? 'empty' : ''}`}
                          >
                            <div className="checkin-week">Week {week}</div>
                            {checkin ? (
                              <>
                                <div className="checkin-metric">
                                  Energy: <span>{checkin.energy_level}</span>
                                </div>
                                <div className="checkin-metric">
                                  Sleep: <span>{checkin.sleep_quality}</span>
                                </div>
                                <div className="checkin-metric">
                                  Recovery: <span>{checkin.recovery}</span>
                                </div>
                                <div className="checkin-metric">
                                  Clarity: <span>{checkin.mental_clarity}</span>
                                </div>
                                <div className="checkin-metric" style={{ marginTop: '0.5rem' }}>
                                  RLT: {checkin.rlt_sessions_completed}/3 • HBOT: {checkin.hbot_sessions_completed}/3
                                </div>
                              </>
                            ) : (
                              <div style={{ color: '#999', fontSize: '0.75rem' }}>
                                Not recorded
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Improvement Summary */}
                    {(() => {
                      const improvement = calculateImprovement(patientCheckins[patient.patient_id]);
                      if (!improvement) return null;
                      
                      return (
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: '600', marginRight: '0.5rem' }}>Improvement:</span>
                          {Object.entries({
                            'Energy': improvement.energy,
                            'Sleep': improvement.sleep,
                            'Recovery': improvement.recovery,
                            'Clarity': improvement.clarity
                          }).map(([label, value]) => (
                            <span 
                              key={label}
                              className={`improvement ${value > 0 ? 'positive' : value < 0 ? 'negative' : 'neutral'}`}
                            >
                              {label}: {value > 0 ? '+' : ''}{value}
                            </span>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
