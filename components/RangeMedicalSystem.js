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
  const [submitting, setSubmitting] = useState(false);
  
  // New protocol form state
  const [newProtocol, setNewProtocol] = useState({
    patient_id: '',
    type: 'peptide',
    name: '',
    start_date: new Date().toISOString().split('T')[0],
    duration: '',
    status: 'active',
    price: '',
    dosing: '',
    injection_schedule: '',
    next_lab_date: '',
    notes: ''
  });
  
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

  const handleAddProtocol = async (e) => {
    e.preventDefault();
    
    if (!newProtocol.patient_id || !newProtocol.name || !newProtocol.price) {
      alert('Please fill in required fields: Patient, Protocol Name, and Price');
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch('/api/protocols', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProtocol)
      });

      if (!response.ok) throw new Error('Failed to add protocol');

      // Refresh patients to show new protocol
      await fetchPatients();
      
      // Reset form
      setNewProtocol({
        patient_id: '',
        type: 'peptide',
        name: '',
        start_date: new Date().toISOString().split('T')[0],
        duration: '',
        status: 'active',
        price: '',
        dosing: '',
        injection_schedule: '',
        next_lab_date: '',
        notes: ''
      });
      
      setShowAddModal(false);
      alert('Protocol added successfully!');
    } catch (err) {
      alert('Error adding protocol: ' + err.message);
      console.error('Error:', err);
    } finally {
      setSubmitting(false);
    }
  };
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

  const handleAddProtocol = async (e) => {
    e.preventDefault();
    
    if (!newProtocol.patient_id || !newProtocol.name) {
      alert('Please select a patient and enter a protocol name');
      return;
    }
    
    try {
      setSubmitting(true);
      
      const response = await fetch('/api/protocols/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patient_id: newProtocol.patient_id,
          type: newProtocol.type,
          name: newProtocol.name,
          start_date: newProtocol.start_date,
          duration: newProtocol.duration ? parseInt(newProtocol.duration) : null,
          status: newProtocol.status,
          price: newProtocol.price ? parseFloat(newProtocol.price) : null,
          dosing: newProtocol.dosing || null,
          injection_schedule: newProtocol.injection_schedule || null,
          next_lab_date: newProtocol.next_lab_date || null,
          notes: newProtocol.notes || null
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to add protocol');
      }
      
      // Success! Reset form and close modal
      setNewProtocol({
        patient_id: '',
        type: 'peptide',
        name: '',
        start_date: new Date().toISOString().split('T')[0],
        duration: '',
        status: 'active',
        price: '',
        dosing: '',
        injection_schedule: '',
        next_lab_date: '',
        notes: ''
      });
      setShowAddModal(false);
      
      // Refresh patient data
      await fetchPatients();
      
      alert('Protocol added successfully!');
    } catch (err) {
      console.error('Error adding protocol:', err);
      alert('Failed to add protocol. Please try again.');
    } finally {
      setSubmitting(false);
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
    patient.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone?.toLowerCase().includes(searchTerm.toLowerCase())
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

      {/* Patient Detail View */}
      {selectedPatient && (
        <div>
          {/* Back Button */}
          <button 
            className="btn"
            onClick={() => setSelectedPatient(null)}
            style={{ marginBottom: '1.5rem' }}
          >
            <ChevronRight size={16} style={{ transform: 'rotate(180deg)' }} />
            Back to Patients
          </button>

          {/* Patient Header */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
                  {selectedPatient.name}
                </h2>
                <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div style={{ fontSize: '0.9rem', color: '#666666' }}>{selectedPatient.email}</div>
                  {selectedPatient.phone && <div style={{ fontSize: '0.9rem', color: '#666666' }}>{selectedPatient.phone}</div>}
                  {selectedPatient.dateOfBirth && (
                    <div style={{ fontSize: '0.85rem', color: '#666666' }}>
                      DOB: {new Date(selectedPatient.dateOfBirth).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: '#666666', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>
                    Active Protocols
                  </div>
                  <div style={{ fontFamily: 'Courier Prime', fontSize: '1.75rem', fontWeight: 700 }}>
                    {selectedPatient.protocols?.filter(p => p.status === 'active').length || 0}
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: '#666666', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>
                    Total Protocols
                  </div>
                  <div style={{ fontFamily: 'Courier Prime', fontSize: '1.75rem', fontWeight: 700 }}>
                    {selectedPatient.protocols?.length || 0}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Protocols Section */}
          <div className="card">
            <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
              Treatment Protocols
            </h3>
            
            {selectedPatient.protocols && selectedPatient.protocols.length > 0 ? (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {selectedPatient.protocols.map(protocol => {
                  const getProtocolIcon = (type) => {
                    switch(type) {
                      case 'peptide': return <Syringe size={20} />;
                      case 'hrt': return <Activity size={20} />;
                      case 'weightloss': return <TrendingUp size={20} />;
                      case 'iv': return <Droplet size={20} />;
                      case 'hbot': return <Wind size={20} />;
                      case 'rlt': return <Sun size={20} />;
                      default: return <FileText size={20} />;
                    }
                  };

                  const statusColor = protocol.status === 'active' ? '#000000' : '#999999';
                  const statusBg = protocol.status === 'active' ? '#ffffff' : '#f5f5f5';

                  return (
                    <div 
                      key={protocol.id} 
                      style={{ 
                        padding: '1.25rem', 
                        border: `2px solid ${statusColor}`,
                        background: statusBg
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'start' }}>
                          <div style={{ marginTop: '0.15rem', color: statusColor }}>
                            {getProtocolIcon(protocol.type)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '1rem', textTransform: 'uppercase', color: statusColor }}>
                              {protocol.name}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#666666', textTransform: 'uppercase', marginTop: '0.25rem' }}>
                              {protocol.type}
                            </div>
                          </div>
                        </div>
                        <div style={{ 
                          padding: '0.35rem 0.75rem', 
                          border: `2px solid ${statusColor}`, 
                          fontSize: '0.7rem', 
                          fontWeight: 700, 
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          background: protocol.status === 'active' ? '#000000' : '#ffffff',
                          color: protocol.status === 'active' ? '#ffffff' : '#000000'
                        }}>
                          {protocol.status}
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', fontSize: '0.85rem' }}>
                        {protocol.startDate && (
                          <div>
                            <div style={{ color: '#666666', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>Start Date</div>
                            <div style={{ fontFamily: 'Courier Prime', fontWeight: 700 }}>
                              {new Date(protocol.startDate).toLocaleDateString()}
                            </div>
                          </div>
                        )}
                        {protocol.duration && (
                          <div>
                            <div style={{ color: '#666666', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>Duration</div>
                            <div style={{ fontFamily: 'Courier Prime', fontWeight: 700 }}>{protocol.duration} days</div>
                          </div>
                        )}
                        {protocol.price && (
                          <div>
                            <div style={{ color: '#666666', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>Price</div>
                            <div style={{ fontFamily: 'Courier Prime', fontWeight: 700 }}>${protocol.price}</div>
                          </div>
                        )}
                        {protocol.dosing && (
                          <div>
                            <div style={{ color: '#666666', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>Dosing</div>
                            <div style={{ fontFamily: 'Courier Prime', fontWeight: 700 }}>{protocol.dosing}</div>
                          </div>
                        )}
                        {protocol.injectionSchedule && (
                          <div>
                            <div style={{ color: '#666666', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>Schedule</div>
                            <div style={{ fontFamily: 'Courier Prime', fontWeight: 700 }}>{protocol.injectionSchedule}</div>
                          </div>
                        )}
                        {protocol.nextLabDate && (
                          <div>
                            <div style={{ color: '#666666', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>Next Lab</div>
                            <div style={{ fontFamily: 'Courier Prime', fontWeight: 700 }}>
                              {new Date(protocol.nextLabDate).toLocaleDateString()}
                            </div>
                          </div>
                        )}
                      </div>

                      {protocol.notes && (
                        <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#f9f9f9', border: '1px solid #e0e0e0' }}>
                          <div style={{ fontSize: '0.75rem', color: '#666666', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.35rem' }}>
                            Notes
                          </div>
                          <div style={{ fontSize: '0.85rem' }}>{protocol.notes}</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#666666' }}>
                No protocols found for this patient
              </div>
            )}
          </div>

          {/* Labs Section */}
          {selectedPatient.labs && selectedPatient.labs.length > 0 && (
            <div className="card" style={{ marginTop: '1.5rem' }}>
              <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                Lab Results
              </h3>
              <div style={{ display: 'grid', gap: '1rem' }}>
                {selectedPatient.labs.map((lab, index) => (
                  <div key={index} style={{ padding: '1rem', border: '2px solid #000000' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <div style={{ fontWeight: 700, textTransform: 'uppercase' }}>{lab.type}</div>
                      <div style={{ fontFamily: 'Courier Prime', fontSize: '0.9rem' }}>
                        {new Date(lab.date).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#666666' }}>
                      {Object.keys(lab.results || {}).length} values recorded
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Measurements Section */}
          {selectedPatient.measurements && selectedPatient.measurements.length > 0 && (
            <div className="card" style={{ marginTop: '1.5rem' }}>
              <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                Body Measurements
              </h3>
              <div style={{ display: 'grid', gap: '1rem' }}>
                {selectedPatient.measurements.slice(0, 5).map((measurement, index) => (
                  <div key={index} style={{ padding: '1rem', border: '2px solid #000000' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                      <div style={{ fontFamily: 'Courier Prime', fontWeight: 700 }}>
                        {new Date(measurement.date).toLocaleDateString()}
                      </div>
                      <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem' }}>
                        {measurement.weight && (
                          <div>
                            <span style={{ color: '#666666' }}>Weight:</span> <span style={{ fontFamily: 'Courier Prime', fontWeight: 700 }}>{measurement.weight} lbs</span>
                          </div>
                        )}
                        {measurement.bodyFat && (
                          <div>
                            <span style={{ color: '#666666' }}>Body Fat:</span> <span style={{ fontFamily: 'Courier Prime', fontWeight: 700 }}>{measurement.bodyFat}%</span>
                          </div>
                        )}
                        {measurement.waist && (
                          <div>
                            <span style={{ color: '#666666' }}>Waist:</span> <span style={{ fontFamily: 'Courier Prime', fontWeight: 700 }}>{measurement.waist}"</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Protocol Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: '#ffffff',
            border: '3px solid #000000',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            padding: '2rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
                Add New Protocol
              </h2>
              <button 
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' }}
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleAddProtocol}>
              {/* Patient Selection */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Patient *
                </label>
                <select
                  value={newProtocol.patient_id}
                  onChange={(e) => setNewProtocol({...newProtocol, patient_id: e.target.value})}
                  required
                  style={{
                    width: '100%',
                    padding: '0.65rem',
                    border: '2px solid #000000',
                    fontFamily: 'Inter',
                    fontSize: '0.9rem'
                  }}
                >
                  <option value="">Select a patient...</option>
                  {patients.sort((a, b) => a.name.localeCompare(b.name)).map(patient => (
                    <option key={patient.id} value={patient.id}>
                      {patient.name} ({patient.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Protocol Type */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Protocol Type *
                </label>
                <select
                  value={newProtocol.type}
                  onChange={(e) => setNewProtocol({...newProtocol, type: e.target.value})}
                  required
                  style={{
                    width: '100%',
                    padding: '0.65rem',
                    border: '2px solid #000000',
                    fontFamily: 'Inter',
                    fontSize: '0.9rem'
                  }}
                >
                  <option value="peptide">Peptide</option>
                  <option value="hrt">HRT</option>
                  <option value="weightloss">Weight Loss</option>
                  <option value="iv">IV Therapy</option>
                  <option value="hbot">HBOT</option>
                  <option value="rlt">Red Light Therapy</option>
                </select>
              </div>

              {/* Protocol Name */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Protocol Name *
                </label>
                <input
                  type="text"
                  value={newProtocol.name}
                  onChange={(e) => setNewProtocol({...newProtocol, name: e.target.value})}
                  placeholder="e.g., BPC-157 + TB-500"
                  required
                  style={{
                    width: '100%',
                    padding: '0.65rem',
                    border: '2px solid #000000',
                    fontFamily: 'Inter',
                    fontSize: '0.9rem'
                  }}
                />
              </div>

              {/* Two Column Layout */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                {/* Start Date */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={newProtocol.start_date}
                    onChange={(e) => setNewProtocol({...newProtocol, start_date: e.target.value})}
                    required
                    style={{
                      width: '100%',
                      padding: '0.65rem',
                      border: '2px solid #000000',
                      fontFamily: 'Inter',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>

                {/* Duration */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Duration (days)
                  </label>
                  <input
                    type="number"
                    value={newProtocol.duration}
                    onChange={(e) => setNewProtocol({...newProtocol, duration: e.target.value})}
                    placeholder="10, 30, etc."
                    style={{
                      width: '100%',
                      padding: '0.65rem',
                      border: '2px solid #000000',
                      fontFamily: 'Inter',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>
              </div>

              {/* Price and Status */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                {/* Price */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Price * ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newProtocol.price}
                    onChange={(e) => setNewProtocol({...newProtocol, price: e.target.value})}
                    placeholder="250.00"
                    required
                    style={{
                      width: '100%',
                      padding: '0.65rem',
                      border: '2px solid #000000',
                      fontFamily: 'Inter',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>

                {/* Status */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Status *
                  </label>
                  <select
                    value={newProtocol.status}
                    onChange={(e) => setNewProtocol({...newProtocol, status: e.target.value})}
                    required
                    style={{
                      width: '100%',
                      padding: '0.65rem',
                      border: '2px solid #000000',
                      fontFamily: 'Inter',
                      fontSize: '0.9rem'
                    }}
                  >
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="paused">Paused</option>
                  </select>
                </div>
              </div>

              {/* Conditional Fields Based on Type */}
              {(newProtocol.type === 'peptide' || newProtocol.type === 'hrt' || newProtocol.type === 'weightloss') && (
                <>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Dosing
                    </label>
                    <input
                      type="text"
                      value={newProtocol.dosing}
                      onChange={(e) => setNewProtocol({...newProtocol, dosing: e.target.value})}
                      placeholder="e.g., 100mg weekly, 5mg daily"
                      style={{
                        width: '100%',
                        padding: '0.65rem',
                        border: '2px solid #000000',
                        fontFamily: 'Inter',
                        fontSize: '0.9rem'
                      }}
                    />
                  </div>

                  {newProtocol.type === 'peptide' && (
                    <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Injection Schedule
                      </label>
                      <select
                        value={newProtocol.injection_schedule}
                        onChange={(e) => setNewProtocol({...newProtocol, injection_schedule: e.target.value})}
                        style={{
                          width: '100%',
                          padding: '0.65rem',
                          border: '2px solid #000000',
                          fontFamily: 'Inter',
                          fontSize: '0.9rem'
                        }}
                      >
                        <option value="">Select schedule...</option>
                        <option value="Daily">Daily</option>
                        <option value="Every other day">Every other day</option>
                        <option value="Twice weekly">Twice weekly</option>
                        <option value="Weekly">Weekly</option>
                      </select>
                    </div>
                  )}
                </>
              )}

              {/* Next Lab Date for HRT */}
              {newProtocol.type === 'hrt' && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Next Lab Date
                  </label>
                  <input
                    type="date"
                    value={newProtocol.next_lab_date}
                    onChange={(e) => setNewProtocol({...newProtocol, next_lab_date: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '0.65rem',
                      border: '2px solid #000000',
                      fontFamily: 'Inter',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>
              )}

              {/* Notes */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Notes
                </label>
                <textarea
                  value={newProtocol.notes}
                  onChange={(e) => setNewProtocol({...newProtocol, notes: e.target.value})}
                  placeholder="Any additional notes..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.65rem',
                    border: '2px solid #000000',
                    fontFamily: 'Inter',
                    fontSize: '0.9rem',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Adding...' : 'Add Protocol'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Show dashboard only when no patient is selected */}
      {!selectedPatient && (
        <>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
          <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
            Patients ({filteredPatients.length})
          </h3>
          
          {/* Search Bar */}
          <div style={{ position: 'relative', flex: '1', maxWidth: '400px', minWidth: '250px' }}>
            <Search 
              size={18} 
              style={{ 
                position: 'absolute', 
                left: '12px', 
                top: '50%', 
                transform: 'translateY(-50%)', 
                color: '#666666' 
              }} 
            />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 0.65rem 0.65rem 2.5rem',
                border: '2px solid #000000',
                fontFamily: 'Inter',
                fontSize: '0.85rem',
                outline: 'none'
              }}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {filteredPatients.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#666666' }}>
            {searchTerm ? (
              <>
                <div style={{ marginBottom: '0.5rem' }}>No patients found matching "{searchTerm}"</div>
                <div style={{ fontSize: '0.85rem' }}>Try a different search term</div>
              </>
            ) : (
              <>
                <div style={{ marginBottom: '0.5rem' }}>No patients found</div>
                <div style={{ fontSize: '0.85rem' }}>Add your first patient to get started</div>
              </>
            )}
          </div>
        ) : (
          <>
            {searchTerm && (
              <div style={{ marginBottom: '1rem', padding: '0.75rem', background: '#f5f5f5', border: '1px solid #e0e0e0', fontSize: '0.85rem' }}>
                <strong>{filteredPatients.length}</strong> patient{filteredPatients.length === 1 ? '' : 's'} found
              </div>
            )}
            <div style={{ display: 'grid', gap: '1rem' }}>
              {filteredPatients.map(patient => (
                <div 
                  key={patient.id} 
                  onClick={() => setSelectedPatient(patient)}
                  style={{ 
                    padding: '1rem', 
                    border: '2px solid #000000',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#ffffff'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1rem', textTransform: 'uppercase' }}>{patient.name}</div>
                      <div style={{ fontSize: '0.85rem', color: '#666666' }}>{patient.email}</div>
                      {patient.phone && (
                        <div style={{ fontSize: '0.85rem', color: '#666666', marginTop: '0.15rem' }}>{patient.phone}</div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.75rem', color: '#666666', textTransform: 'uppercase' }}>Active Protocols</div>
                      <div style={{ fontFamily: 'Courier Prime', fontSize: '1.5rem', fontWeight: 700 }}>
                        {patient.protocols?.filter(p => p.status === 'active').length || 0}
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#666666', fontSize: '0.75rem' }}>
                    <span>Click to view details</span>
                    <ChevronRight size={14} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      </>
      )}
    </div>
  );
};

export default RangeMedicalSystem;
