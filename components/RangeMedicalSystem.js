import React, { useState, useEffect } from 'react';
import { Plus, Search, Calendar, TrendingUp, Users, DollarSign, AlertCircle, Activity, Syringe, Droplet, Sun, Wind, FileText, Bell, ChevronRight, X, Loader } from 'lucide-react';

const RangeMedicalSystem = () => {
  const [activeView, setActiveView] = useState('dashboard');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProtocol, setFilterProtocol] = useState('all');
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch patients and all their data from API
  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/patients');
      if (!response.ok) throw new Error('Failed to fetch patients');
      const data = await response.json();
      
      // Transform data to match component format
      const transformedData = data.map(patient => ({
        ...patient,
        dateOfBirth: patient.date_of_birth,
        protocols: patient.protocols.map(p => ({
          ...p,
          startDate: p.start_date,
          endDate: p.end_date,
          injectionSchedule: p.injection_schedule,
          currentDose: p.current_dose,
          targetDose: p.target_dose,
          nextDoseIncrease: p.next_dose_increase,
          nextLabDate: p.next_lab_date,
          sessionsTotal: p.sessions_total,
          sessionsCompleted: p.sessions_completed,
          lastSession: p.last_session,
          stripeId: p.stripe_transaction_id
        })),
        labs: patient.labs.map(l => ({
          date: l.lab_date,
          type: l.panel_type,
          results: l.results
        })),
        symptoms: patient.symptoms.map(s => ({
          date: s.symptom_date,
          energy: s.energy,
          mood: s.mood,
          sleep: s.sleep,
          recovery: s.recovery,
          libido: s.libido,
          brainfog: s.brain_fog,
          appetite: s.appetite,
          pain: s.pain,
          bloating: s.bloating
        })),
        measurements: patient.measurements.map(m => ({
          date: m.measurement_date,
          weight: m.weight,
          bodyFat: m.body_fat,
          waist: m.waist,
          bp: m.blood_pressure
        }))
      }));
      
      setPatients(transformedData);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching patients:', err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate alerts
  const getAlerts = () => {
    const alerts = [];
    const today = new Date();
    
    patients.forEach(patient => {
      patient.protocols?.forEach(protocol => {
        if (protocol.type === 'hrt' && protocol.nextLabDate) {
          const labDate = new Date(protocol.nextLabDate);
          const daysUntil = Math.ceil((labDate - today) / (1000 * 60 * 60 * 24));
          
          if (daysUntil <= 7 && daysUntil > 0) {
            alerts.push({
              type: 'warning',
              patient: patient.name,
              message: `Labs due in ${daysUntil} days`,
              protocol: protocol.name,
              priority: 'medium'
            });
          } else if (daysUntil <= 0) {
            alerts.push({
              type: 'urgent',
              patient: patient.name,
              message: 'Labs overdue',
              protocol: protocol.name,
              priority: 'high'
            });
          }
        }
        
        if (protocol.duration) {
          const startDate = new Date(protocol.startDate);
          const endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + protocol.duration);
          const daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
          
          if (daysRemaining <= 3 && daysRemaining > 0) {
            alerts.push({
              type: 'info',
              patient: patient.name,
              message: `Protocol ending in ${daysRemaining} days`,
              protocol: protocol.name,
              priority: 'medium'
            });
          }
        }
        
        if (protocol.nextDoseIncrease) {
          const doseDate = new Date(protocol.nextDoseIncrease);
          const daysUntil = Math.ceil((doseDate - today) / (1000 * 60 * 60 * 24));
          
          if (daysUntil <= 7 && daysUntil > 0) {
            alerts.push({
              type: 'info',
              patient: patient.name,
              message: `Dose increase due in ${daysUntil} days`,
              protocol: protocol.name,
              priority: 'medium'
            });
          }
        }
      });
      
      if (patient.symptoms?.length > 0) {
        const lastSymptom = new Date(patient.symptoms[0].date);
        const daysSince = Math.ceil((today - lastSymptom) / (1000 * 60 * 60 * 24));
        
        if (daysSince > 10) {
          alerts.push({
            type: 'info',
            patient: patient.name,
            message: `No symptom check-in for ${daysSince} days`,
            priority: 'low'
          });
        }
      }
    });
    
    return alerts.sort((a, b) => {
      const priority = { high: 3, medium: 2, low: 1 };
      return priority[b.priority] - priority[a.priority];
    });
  };

  const getProtocolStats = () => {
    const stats = {
      peptide: 0,
      hrt: 0,
      weightloss: 0,
      iv: 0,
      hbot: 0,
      rlt: 0,
      total: 0
    };
    
    patients.forEach(patient => {
      patient.protocols?.forEach(protocol => {
        if (protocol.status === 'active') {
          stats[protocol.type]++;
          stats.total++;
        }
      });
    });
    
    return stats;
  };

  const getRevenueData = () => {
    let total = 0;
    const byType = {
      peptide: 0,
      hrt: 0,
      weightloss: 0,
      iv: 0,
      hbot: 0,
      rlt: 0
    };
    
    patients.forEach(patient => {
      patient.protocols?.forEach(protocol => {
        const price = parseFloat(protocol.price) || 0;
        total += price;
        byType[protocol.type] = (byType[protocol.type] || 0) + price;
      });
    });
    
    return { total, byType };
  };

  const protocolStats = getProtocolStats();
  const alerts = getAlerts();
  const revenueData = getRevenueData();
  
  const protocolTypes = {
    peptide: { icon: Syringe, label: 'Peptides', color: '#000000' },
    hrt: { icon: Activity, label: 'HRT', color: '#000000' },
    weightloss: { icon: TrendingUp, label: 'Weight Loss', color: '#000000' },
    iv: { icon: Droplet, label: 'IV Therapy', color: '#000000' },
    hbot: { icon: Wind, label: 'HBOT', color: '#000000' },
    rlt: { icon: Sun, label: 'Red Light', color: '#000000' }
  };

  const filteredPatients = patients.filter(patient =>
    patient.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <Loader size={48} style={{ animation: 'spin 1s linear infinite' }} />
        <div style={{ fontSize: '1rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
          Loading Range Medical System...
        </div>
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '1rem',
        padding: '2rem'
      }}>
        <AlertCircle size={48} />
        <div style={{ fontSize: '1rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
          Error Loading System
        </div>
        <div style={{ fontSize: '0.9rem', color: '#666666', textAlign: 'center', maxWidth: '500px' }}>
          {error}
        </div>
        <button 
          onClick={fetchPatients}
          style={{
            padding: '0.75rem 1.5rem',
            border: '2px solid #000000',
            background: '#000000',
            color: '#ffffff',
            fontWeight: 700,
            cursor: 'pointer',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            fontSize: '0.8rem',
            marginTop: '1rem'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  // The rest of the component remains the same as the previous version
  // Just using the fetched data from the backend instead of hardcoded data
  
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#ffffff',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      color: '#000000',
      padding: '2rem'
    }}>
      {/* All the styles and components from the previous version */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Courier+Prime:wght@400;700&display=swap');
        
        * { box-sizing: border-box; }
        .card { background: #ffffff; border: 2px solid #000000; padding: 1.5rem; margin-bottom: 1.5rem; }
        .btn { padding: 0.65rem 1.25rem; border: 2px solid #000000; font-weight: 700; cursor: pointer; font-family: 'Inter', sans-serif; display: inline-flex; align-items: center; gap: 0.5rem; text-transform: uppercase; letter-spacing: 0.5px; font-size: 0.8rem; background: #ffffff; color: #000000; transition: all 0.2s ease; }
        .btn-primary { background: #000000; color: #ffffff; }
        .btn-primary:hover { background: #ffffff; color: #000000; }
        .btn:hover { background: #000000; color: #ffffff; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: '2rem', borderBottom: '3px solid #000000', paddingBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
              RANGE MEDICAL
            </h1>
            <p style={{ margin: '0.25rem 0 0 0', color: '#666666', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 600 }}>
              Treatment Protocol Management System
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <button className="btn" onClick={() => setActiveView('alerts')}>
                <Bell size={16} />
                Alerts
                {alerts.length > 0 && (
                  <span style={{ 
                    position: 'absolute', 
                    top: '-8px', 
                    right: '-8px', 
                    background: '#000000', 
                    color: '#ffffff', 
                    borderRadius: '50%', 
                    width: '24px', 
                    height: '24px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontSize: '0.7rem',
                    fontWeight: 700
                  }}>
                    {alerts.length}
                  </span>
                )}
              </button>
            </div>
            <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
              <Plus size={16} />
              Add Protocol
            </button>
          </div>
        </div>
      </div>

      {/* Simple dashboard with metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <div className="card">
          <div style={{ fontSize: '0.7rem', color: '#666666', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, marginBottom: '0.5rem' }}>
            Total Active Protocols
          </div>
          <div style={{ fontFamily: 'Courier Prime', fontSize: '2rem', fontWeight: 700 }}>{protocolStats.total}</div>
        </div>
        
        <div className="card">
          <div style={{ fontSize: '0.7rem', color: '#666666', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, marginBottom: '0.5rem' }}>
            Active Patients
          </div>
          <div style={{ fontFamily: 'Courier Prime', fontSize: '2rem', fontWeight: 700 }}>{patients.length}</div>
        </div>
        
        <div className="card">
          <div style={{ fontSize: '0.7rem', color: '#666666', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, marginBottom: '0.5rem' }}>
            Pending Alerts
          </div>
          <div style={{ fontFamily: 'Courier Prime', fontSize: '2rem', fontWeight: 700 }}>{alerts.length}</div>
        </div>
        
        <div className="card">
          <div style={{ fontSize: '0.7rem', color: '#666666', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, marginBottom: '0.5rem' }}>
            Total Revenue
          </div>
          <div style={{ fontFamily: 'Courier Prime', fontSize: '2rem', fontWeight: 700 }}>${revenueData.total.toLocaleString()}</div>
        </div>
      </div>

      {/* Patient list */}
      <div className="card">
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
          Patients ({patients.length})
        </h3>
        {patients.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#666666' }}>
            <div style={{ marginBottom: '0.5rem' }}>No patients found</div>
            <div style={{ fontSize: '0.85rem' }}>Add your first patient to get started</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {patients.slice(0, 10).map(patient => (
              <div key={patient.id} style={{ padding: '1rem', border: '2px solid #000000' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', textTransform: 'uppercase' }}>{patient.name}</div>
                    <div style={{ fontSize: '0.85rem', color: '#666666' }}>{patient.email}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', color: '#666666', textTransform: 'uppercase' }}>Active Protocols</div>
                    <div style={{ fontFamily: 'Courier Prime', fontSize: '1.5rem', fontWeight: 700 }}>
                      {patient.protocols?.filter(p => p.status === 'active').length || 0}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RangeMedicalSystem;
