// pages/tracker.jsx
import { useState, useEffect } from 'react';
import Layout from '../components/Layout';

export default function CellularEnergyTracker() {
  // State
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [checkins, setCheckins] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    energy_level: 5,
    sleep_quality: 5,
    recovery: 5,
    mental_clarity: 5,
    rlt_sessions_completed: 0,
    hbot_sessions_completed: 0,
    notes: '',
    recorded_by: ''
  });

  // Fetch patients on load
  useEffect(() => {
    fetchPatients();
  }, []);

  // Fetch checkins when patient changes
  useEffect(() => {
    if (selectedPatient) {
      fetchCheckins(selectedPatient.patient_id);
    }
  }, [selectedPatient]);

  // Load existing data when week changes
  useEffect(() => {
    if (checkins[selectedWeek]) {
      setFormData({
        energy_level: checkins[selectedWeek].energy_level || 5,
        sleep_quality: checkins[selectedWeek].sleep_quality || 5,
        recovery: checkins[selectedWeek].recovery || 5,
        mental_clarity: checkins[selectedWeek].mental_clarity || 5,
        rlt_sessions_completed: checkins[selectedWeek].rlt_sessions_completed || 0,
        hbot_sessions_completed: checkins[selectedWeek].hbot_sessions_completed || 0,
        notes: checkins[selectedWeek].notes || '',
        recorded_by: checkins[selectedWeek].recorded_by || ''
      });
    } else {
      // Reset form for new week
      setFormData({
        energy_level: 5,
        sleep_quality: 5,
        recovery: 5,
        mental_clarity: 5,
        rlt_sessions_completed: 0,
        hbot_sessions_completed: 0,
        notes: '',
        recorded_by: formData.recorded_by // Keep staff name
      });
    }
  }, [selectedWeek, checkins]);

  const fetchPatients = async () => {
    try {
      const res = await fetch('/api/cellular-energy/patients');
      const data = await res.json();
      setPatients(data.patients || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCheckins = async (patientId) => {
    try {
      const res = await fetch(`/api/cellular-energy/checkin?patient_id=${patientId}`);
      const data = await res.json();
      
      // Convert to object keyed by week number
      const checkinsMap = {};
      (data.checkins || []).forEach(c => {
        checkinsMap[c.week_number] = c;
      });
      setCheckins(checkinsMap);
    } catch (error) {
      console.error('Error fetching checkins:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPatient) return;

    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/cellular-energy/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: selectedPatient.patient_id,
          protocol_id: selectedPatient.protocol_id,
          week_number: selectedWeek,
          ...formData
        })
      });

      const data = await res.json();

      if (data.success) {
        setMessage({ type: 'success', text: `Week ${selectedWeek} saved successfully!` });
        // Refresh checkins
        fetchCheckins(selectedPatient.patient_id);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error saving check-in' });
    } finally {
      setSaving(false);
    }
  };

  const handleSliderChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: parseInt(value) }));
  };

  const handleSessionToggle = (type, index) => {
    const field = type === 'rlt' ? 'rlt_sessions_completed' : 'hbot_sessions_completed';
    const current = formData[field];
    // Toggle: if clicking on a checked box, uncheck it and all after. If unchecked, check it.
    const newValue = index < current ? index : index + 1;
    setFormData(prev => ({ ...prev, [field]: Math.min(3, Math.max(0, newValue)) }));
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
        .tracker-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem 1rem;
        }
        .tracker-header {
          margin-bottom: 2rem;
        }
        .tracker-header h1 {
          font-size: 1.75rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }
        .tracker-header p {
          color: #666;
        }
        .form-section {
          background: #fff;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }
        .form-section h3 {
          font-size: 1rem;
          font-weight: 600;
          margin-bottom: 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid #e5e5e5;
        }
        .patient-select {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #d4d4d4;
          border-radius: 8px;
          font-size: 1rem;
          margin-bottom: 1rem;
        }
        .week-tabs {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1rem;
          flex-wrap: wrap;
        }
        .week-tab {
          padding: 0.5rem 1rem;
          border: 1px solid #d4d4d4;
          border-radius: 6px;
          background: #fff;
          cursor: pointer;
          font-size: 0.875rem;
          transition: all 0.2s;
        }
        .week-tab:hover {
          border-color: #1a2f4a;
        }
        .week-tab.active {
          background: #1a2f4a;
          color: #fff;
          border-color: #1a2f4a;
        }
        .week-tab.completed {
          background: #dcfce7;
          border-color: #16a34a;
        }
        .week-tab.completed.active {
          background: #16a34a;
          color: #fff;
        }
        .rating-item {
          margin-bottom: 1.5rem;
        }
        .rating-label {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5rem;
          font-weight: 500;
        }
        .rating-value {
          font-weight: 700;
          color: #1a2f4a;
        }
        .rating-slider {
          width: 100%;
          height: 8px;
          -webkit-appearance: none;
          background: #e5e5e5;
          border-radius: 4px;
          outline: none;
        }
        .rating-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 24px;
          height: 24px;
          background: #1a2f4a;
          border-radius: 50%;
          cursor: pointer;
        }
        .rating-endpoints {
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
          color: #888;
          margin-top: 0.25rem;
        }
        .sessions-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }
        .session-type {
          margin-bottom: 0.5rem;
        }
        .session-type-label {
          font-weight: 500;
          margin-bottom: 0.5rem;
        }
        .session-boxes {
          display: flex;
          gap: 0.5rem;
        }
        .session-box {
          width: 40px;
          height: 40px;
          border: 2px solid #d4d4d4;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          font-weight: 600;
        }
        .session-box:hover {
          border-color: #1a2f4a;
        }
        .session-box.checked {
          background: #1a2f4a;
          border-color: #1a2f4a;
          color: #fff;
        }
        .session-box.checked::after {
          content: '✓';
        }
        .notes-textarea {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #d4d4d4;
          border-radius: 8px;
          font-size: 1rem;
          min-height: 100px;
          resize: vertical;
          font-family: inherit;
        }
        .staff-input {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #d4d4d4;
          border-radius: 8px;
          font-size: 1rem;
        }
        .submit-btn {
          width: 100%;
          padding: 1rem;
          background: #1a2f4a;
          color: #fff;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }
        .submit-btn:hover {
          background: #2a4a6a;
        }
        .submit-btn:disabled {
          background: #ccc;
          cursor: not-allowed;
        }
        .message {
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1rem;
        }
        .message.success {
          background: #dcfce7;
          color: #166534;
        }
        .message.error {
          background: #fee2e2;
          color: #991b1b;
        }
        .patient-info-card {
          background: #f9fafb;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1rem;
        }
        .patient-info-card h4 {
          margin: 0 0 0.5rem 0;
        }
        .patient-info-card p {
          margin: 0;
          font-size: 0.875rem;
          color: #666;
        }
        .progress-bar {
          height: 8px;
          background: #e5e5e5;
          border-radius: 4px;
          margin-top: 0.5rem;
          overflow: hidden;
        }
        .progress-fill {
          height: 100%;
          background: #1a2f4a;
          transition: width 0.3s;
        }
        .no-patients {
          text-align: center;
          padding: 3rem;
          color: #666;
        }
      `}</style>

      <div className="tracker-container">
        <div className="tracker-header">
          <h1>Cellular Energy Tracker</h1>
          <p>Weekly check-in for Reset patients</p>
        </div>

        {message && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        {/* Patient Selection */}
        <div className="form-section">
          <h3>Select Patient</h3>
          {patients.length === 0 ? (
            <div className="no-patients">
              <p>No active Cellular Energy Reset patients found.</p>
              <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                Make sure patients have a protocol with type "cellular_energy_reset"
              </p>
            </div>
          ) : (
            <select 
              className="patient-select"
              value={selectedPatient?.patient_id || ''}
              onChange={(e) => {
                const patient = patients.find(p => p.patient_id === e.target.value);
                setSelectedPatient(patient);
                setSelectedWeek(patient?.current_week || 1);
              }}
            >
              <option value="">-- Select a patient --</option>
              {patients.map(p => (
                <option key={p.patient_id} value={p.patient_id}>
                  {p.last_name}, {p.first_name} — Week {p.current_week || 1}
                </option>
              ))}
            </select>
          )}

          {selectedPatient && (
            <div className="patient-info-card">
              <h4>{selectedPatient.first_name} {selectedPatient.last_name}</h4>
              <p>
                Started: {new Date(selectedPatient.start_date).toLocaleDateString()} • 
                RLT: {selectedPatient.total_rlt_sessions || 0}/18 • 
                HBOT: {selectedPatient.total_hbot_sessions || 0}/18
              </p>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${((selectedPatient.weeks_completed || 0) / 6) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {selectedPatient && (
          <form onSubmit={handleSubmit}>
            {/* Week Selection */}
            <div className="form-section">
              <h3>Select Week</h3>
              <div className="week-tabs">
                {[1, 2, 3, 4, 5, 6].map(week => (
                  <button
                    key={week}
                    type="button"
                    className={`week-tab ${selectedWeek === week ? 'active' : ''} ${checkins[week] ? 'completed' : ''}`}
                    onClick={() => setSelectedWeek(week)}
                  >
                    Week {week}
                    {checkins[week] && ' ✓'}
                  </button>
                ))}
              </div>
            </div>

            {/* Ratings */}
            <div className="form-section">
              <h3>Subjective Ratings</h3>
              
              {[
                { key: 'energy_level', label: 'Overall Energy Level', low: 'Exhausted', high: 'Excellent' },
                { key: 'sleep_quality', label: 'Sleep Quality', low: 'Terrible', high: 'Amazing' },
                { key: 'recovery', label: 'Recovery (Soreness/Fatigue)', low: 'Poor', high: 'Excellent' },
                { key: 'mental_clarity', label: 'Mental Clarity / Focus', low: 'Foggy', high: 'Sharp' }
              ].map(rating => (
                <div key={rating.key} className="rating-item">
                  <div className="rating-label">
                    <span>{rating.label}</span>
                    <span className="rating-value">{formData[rating.key]}/10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={formData[rating.key]}
                    onChange={(e) => handleSliderChange(rating.key, e.target.value)}
                    className="rating-slider"
                  />
                  <div className="rating-endpoints">
                    <span>{rating.low}</span>
                    <span>{rating.high}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Sessions */}
            <div className="form-section">
              <h3>Sessions Completed This Week</h3>
              <div className="sessions-grid">
                <div className="session-type">
                  <div className="session-type-label">Red Light Therapy</div>
                  <div className="session-boxes">
                    {[0, 1, 2].map(i => (
                      <div
                        key={i}
                        className={`session-box ${i < formData.rlt_sessions_completed ? 'checked' : ''}`}
                        onClick={() => handleSessionToggle('rlt', i)}
                      />
                    ))}
                  </div>
                </div>
                <div className="session-type">
                  <div className="session-type-label">HBOT</div>
                  <div className="session-boxes">
                    {[0, 1, 2].map(i => (
                      <div
                        key={i}
                        className={`session-box ${i < formData.hbot_sessions_completed ? 'checked' : ''}`}
                        onClick={() => handleSessionToggle('hbot', i)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="form-section">
              <h3>Notes</h3>
              <textarea
                className="notes-textarea"
                placeholder="Symptoms, wins, concerns, observations..."
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>

            {/* Staff Name */}
            <div className="form-section">
              <h3>Recorded By</h3>
              <input
                type="text"
                className="staff-input"
                placeholder="Staff name"
                value={formData.recorded_by}
                onChange={(e) => setFormData(prev => ({ ...prev, recorded_by: e.target.value }))}
              />
            </div>

            {/* Submit */}
            <button 
              type="submit" 
              className="submit-btn"
              disabled={saving}
            >
              {saving ? 'Saving...' : `Save Week ${selectedWeek} Check-in`}
            </button>
          </form>
        )}
      </div>
    </Layout>
  );
}
