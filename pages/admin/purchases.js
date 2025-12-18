// /pages/admin/purchases.js
// Purchase History Dashboard - With Create Protocol
// Range Medical

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

const CATEGORIES = [
  'All',
  'Peptide',
  'Weight Loss',
  'IV Therapy',
  'Injection',
  'Labs',
  'HRT',
  'Hyperbaric',
  'Red Light',
  'Consultation',
  'Product',
  'Other'
];

// ============================================
// PROTOCOL TEMPLATES
// ============================================
const PROTOCOL_TEMPLATES = {
  'peptide_jumpstart': {
    name: 'Peptide Recovery Jumpstart (10-Day)',
    program_type: 'jumpstart_10day',
    duration_days: 10,
    injection_location: 'take_home',
    dose_frequency: 'Daily',
    tracking: 'daily_injection',
    category: 'Peptide'
  },
  'peptide_month': {
    name: 'Peptide Month Program (30-Day)',
    program_type: 'month_30day',
    duration_days: 30,
    injection_location: 'take_home',
    dose_frequency: 'Daily',
    tracking: 'daily_injection',
    category: 'Peptide'
  },
  'peptide_maintenance': {
    name: 'Peptide Maintenance (4-Week)',
    program_type: 'recovery_10day',
    duration_days: 28,
    injection_location: 'take_home',
    dose_frequency: 'Daily',
    tracking: 'daily_injection',
    category: 'Peptide'
  },
  'peptide_injection': {
    name: 'Peptide Injection (In-Clinic)',
    program_type: 'injection_clinic',
    duration_days: 1,
    injection_location: 'in_clinic',
    dose_frequency: 'Single',
    tracking: 'single_visit',
    category: 'Peptide'
  },
  'weight_loss': {
    name: 'Weight Loss Program',
    program_type: 'weight_loss',
    duration_days: 28,
    injection_location: 'in_clinic',
    dose_frequency: 'Weekly',
    tracking: 'weekly_weigh_in',
    category: 'Weight Loss'
  },
  'hrt': {
    name: 'HRT Membership',
    program_type: 'hrt_membership',
    duration_days: null,
    injection_location: 'take_home',
    dose_frequency: 'As directed',
    tracking: 'quarterly_labs',
    category: 'HRT'
  },
  'hbot': {
    name: 'Hyperbaric Oxygen Therapy',
    program_type: 'hbot_sessions',
    duration_days: null,
    injection_location: 'in_clinic',
    dose_frequency: 'Per session',
    tracking: 'session_count',
    category: 'Hyperbaric'
  },
  'red_light': {
    name: 'Red Light Therapy',
    program_type: 'red_light_sessions',
    duration_days: null,
    injection_location: 'in_clinic',
    dose_frequency: 'Per session',
    tracking: 'session_count',
    category: 'Red Light'
  },
  'iv_therapy': {
    name: 'IV Therapy',
    program_type: 'iv_therapy',
    duration_days: null,
    injection_location: 'in_clinic',
    dose_frequency: 'Per session',
    tracking: 'session_count',
    category: 'IV Therapy'
  },
  'injection_pack': {
    name: 'Injection Pack',
    program_type: 'injection_pack',
    duration_days: null,
    injection_location: 'in_clinic',
    dose_frequency: 'Per session',
    tracking: 'session_count',
    category: 'Injection'
  }
};

// Map purchase categories to template keys
const CATEGORY_TO_TEMPLATE = {
  'Peptide': 'peptide_jumpstart',
  'Weight Loss': 'weight_loss',
  'HRT': 'hrt',
  'Hyperbaric': 'hbot',
  'Red Light': 'red_light',
  'IV Therapy': 'iv_therapy',
  'Injection': 'injection_pack',
  'Labs': null
};

// ============================================
// CREATE PROTOCOL MODAL
// ============================================
function CreateProtocolModal({ purchase, onClose, onSuccess }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Determine template based on purchase category
  const templateKey = CATEGORY_TO_TEMPLATE[purchase?.category] || 'peptide_jumpstart';
  const template = PROTOCOL_TEMPLATES[templateKey] || PROTOCOL_TEMPLATES['peptide_jumpstart'];

  const [formData, setFormData] = useState({
    template: templateKey,
    program_name: template.name,
    program_type: template.program_type,
    injection_location: template.injection_location,
    duration_days: template.duration_days || 10,
    total_sessions: purchase?.quantity > 1 ? purchase.quantity : null,
    primary_peptide: '',
    secondary_peptide: '',
    dose_amount: '',
    dose_frequency: template.dose_frequency,
    start_date: new Date().toISOString().split('T')[0],
    special_instructions: '',
    reminders_enabled: template.injection_location === 'take_home'
  });

  // Update form when template changes
  const handleTemplateChange = (newTemplateKey) => {
    const newTemplate = PROTOCOL_TEMPLATES[newTemplateKey];
    if (newTemplate) {
      setFormData(prev => ({
        ...prev,
        template: newTemplateKey,
        program_name: newTemplate.name,
        program_type: newTemplate.program_type,
        injection_location: newTemplate.injection_location,
        duration_days: newTemplate.duration_days || prev.duration_days,
        dose_frequency: newTemplate.dose_frequency,
        reminders_enabled: newTemplate.injection_location === 'take_home'
      }));
    }
  };

  const calculateEndDate = () => {
    if (!formData.start_date || !formData.duration_days) return null;
    const start = new Date(formData.start_date);
    start.setDate(start.getDate() + parseInt(formData.duration_days));
    return start.toISOString().split('T')[0];
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/protocols', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ghl_contact_id: purchase.ghl_contact_id,
          patient_name: purchase.patient_name,
          patient_email: purchase.patient_email,
          patient_phone: purchase.patient_phone,
          purchase_id: purchase.id,
          program_name: formData.program_name,
          program_type: formData.program_type,
          injection_location: formData.injection_location,
          duration_days: formData.duration_days,
          total_sessions: formData.total_sessions,
          primary_peptide: formData.primary_peptide,
          secondary_peptide: formData.secondary_peptide,
          dose_amount: formData.dose_amount,
          dose_frequency: formData.dose_frequency,
          start_date: formData.start_date,
          end_date: calculateEndDate(),
          special_instructions: formData.special_instructions,
          reminders_enabled: formData.reminders_enabled,
          status: 'active',
          amount: purchase.amount
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create protocol');
      }

      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!purchase) return null;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }} onClick={onClose}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflow: 'auto',
        margin: '20px'
      }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: '20px', borderBottom: '1px solid #e5e5e5' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Create Protocol</h2>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#666' }}>
            {purchase.patient_name} • {purchase.item_name}{purchase.quantity > 1 && ` ×${purchase.quantity}`} ({formatCurrency(purchase.amount)})
          </p>
        </div>

        {/* Form */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {error && (
            <div style={{ padding: '12px', background: '#fef2f2', color: '#991b1b', borderRadius: '6px', fontSize: '14px' }}>
              {error}
            </div>
          )}

          {/* Template Selection */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Protocol Type</label>
            <select
              value={formData.template}
              onChange={(e) => handleTemplateChange(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e5e5', borderRadius: '6px', fontSize: '14px' }}
            >
              <optgroup label="Peptide">
                <option value="peptide_jumpstart">Peptide Recovery Jumpstart (10-Day)</option>
                <option value="peptide_month">Peptide Month Program (30-Day)</option>
                <option value="peptide_maintenance">Peptide Maintenance (4-Week)</option>
                <option value="peptide_injection">Peptide Injection (In-Clinic)</option>
              </optgroup>
              <optgroup label="Other Services">
                <option value="weight_loss">Weight Loss Program</option>
                <option value="hrt">HRT Membership</option>
                <option value="hbot">Hyperbaric Oxygen Therapy</option>
                <option value="red_light">Red Light Therapy</option>
                <option value="iv_therapy">IV Therapy</option>
                <option value="injection_pack">Injection Pack</option>
              </optgroup>
            </select>
          </div>

          {/* Injection Location */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Location</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, injection_location: 'take_home', reminders_enabled: true })}
                style={{
                  flex: 1,
                  padding: '12px',
                  border: formData.injection_location === 'take_home' ? '2px solid black' : '1px solid #e5e5e5',
                  borderRadius: '8px',
                  background: formData.injection_location === 'take_home' ? '#fef3c7' : 'white',
                  fontWeight: formData.injection_location === 'take_home' ? '600' : '400',
                  cursor: 'pointer'
                }}
              >
                🏠 Take Home
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, injection_location: 'in_clinic', reminders_enabled: false })}
                style={{
                  flex: 1,
                  padding: '12px',
                  border: formData.injection_location === 'in_clinic' ? '2px solid black' : '1px solid #e5e5e5',
                  borderRadius: '8px',
                  background: formData.injection_location === 'in_clinic' ? '#e0e7ff' : 'white',
                  fontWeight: formData.injection_location === 'in_clinic' ? '600' : '400',
                  cursor: 'pointer'
                }}
              >
                🏥 In-Clinic
              </button>
            </div>
          </div>

          {/* Peptide Names (for peptide protocols) */}
          {formData.template.startsWith('peptide') && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Primary Peptide</label>
                <input
                  type="text"
                  value={formData.primary_peptide}
                  onChange={(e) => setFormData({ ...formData, primary_peptide: e.target.value })}
                  placeholder="e.g., BPC-157"
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e5e5', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Secondary Peptide</label>
                <input
                  type="text"
                  value={formData.secondary_peptide}
                  onChange={(e) => setFormData({ ...formData, secondary_peptide: e.target.value })}
                  placeholder="e.g., TB-500"
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e5e5', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>
            </div>
          )}

          {/* Dosing */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Dose Amount</label>
              <input
                type="text"
                value={formData.dose_amount}
                onChange={(e) => setFormData({ ...formData, dose_amount: e.target.value })}
                placeholder="e.g., 500mcg"
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e5e5', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Frequency</label>
              <input
                type="text"
                value={formData.dose_frequency}
                onChange={(e) => setFormData({ ...formData, dose_frequency: e.target.value })}
                placeholder="e.g., Daily"
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e5e5', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          {/* Dates */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Start Date</label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e5e5', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Duration (days)</label>
              <input
                type="number"
                value={formData.duration_days || ''}
                onChange={(e) => setFormData({ ...formData, duration_days: parseInt(e.target.value) || null })}
                placeholder="Ongoing"
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e5e5', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>End Date</label>
              <input
                type="date"
                value={calculateEndDate() || ''}
                disabled
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e5e5', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box', background: '#f9f9f9' }}
              />
            </div>
          </div>

          {/* Total Sessions - for session-based protocols */}
          {(['peptide_injection', 'hbot', 'red_light', 'iv_therapy', 'injection_pack'].includes(formData.template) || purchase?.quantity > 1) && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                  Total Sessions
                  {purchase?.quantity > 1 && <span style={{ fontWeight: '400', color: '#666' }}> (from purchase qty)</span>}
                </label>
                <input
                  type="number"
                  value={formData.total_sessions || ''}
                  onChange={(e) => setFormData({ ...formData, total_sessions: parseInt(e.target.value) || null })}
                  placeholder="e.g., 10"
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e5e5', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '2px' }}>
                <span style={{ fontSize: '13px', color: '#666' }}>
                  Track completion as sessions (e.g., 5 of {formData.total_sessions || '?'} completed)
                </span>
              </div>
            </div>
          )}

          {/* Special Instructions */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Special Instructions</label>
            <textarea
              value={formData.special_instructions}
              onChange={(e) => setFormData({ ...formData, special_instructions: e.target.value })}
              placeholder="Any special instructions..."
              rows={3}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e5e5', borderRadius: '6px', fontSize: '14px', resize: 'vertical', boxSizing: 'border-box' }}
            />
          </div>

          {/* Reminders Toggle */}
          {formData.injection_location === 'take_home' && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: '#f9f9f9', borderRadius: '8px' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '500' }}>Daily Reminders</div>
                <div style={{ fontSize: '12px', color: '#666' }}>Send 6:30pm text if no injection logged</div>
              </div>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, reminders_enabled: !formData.reminders_enabled })}
                style={{
                  width: '50px',
                  height: '28px',
                  borderRadius: '14px',
                  border: 'none',
                  background: formData.reminders_enabled ? '#000' : '#e5e5e5',
                  cursor: 'pointer',
                  position: 'relative'
                }}
              >
                <div style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  background: 'white',
                  position: 'absolute',
                  top: '3px',
                  left: formData.reminders_enabled ? '25px' : '3px',
                  transition: 'left 0.2s'
                }} />
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '20px', borderTop: '1px solid #e5e5e5', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{ padding: '10px 20px', border: '1px solid #e5e5e5', borderRadius: '6px', background: 'white', fontSize: '14px', cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            style={{
              padding: '10px 24px',
              border: 'none',
              borderRadius: '6px',
              background: '#000',
              color: '#fff',
              fontSize: '14px',
              fontWeight: '500',
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.6 : 1
            }}
          >
            {saving ? 'Creating...' : 'Create Protocol'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// EDIT AMOUNT MODAL
// ============================================
function EditAmountModal({ purchase, onClose, onSuccess }) {
  const [amount, setAmount] = useState(purchase?.amount || 0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/purchases/${purchase.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseFloat(amount) })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update amount');
      }

      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!purchase) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }} onClick={onClose}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '400px',
        margin: '20px'
      }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: '20px', borderBottom: '1px solid #e5e5e5' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Edit Amount</h2>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#666' }}>
            {purchase.patient_name} • {purchase.item_name}
          </p>
        </div>

        {/* Content */}
        <div style={{ padding: '20px' }}>
          {error && (
            <div style={{ padding: '12px', background: '#fef2f2', color: '#991b1b', borderRadius: '6px', fontSize: '14px', marginBottom: '16px' }}>
              {error}
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
              Amount Paid
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ 
                position: 'absolute', 
                left: '12px', 
                top: '50%', 
                transform: 'translateY(-50%)',
                color: '#666',
                fontSize: '16px'
              }}>$</span>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '12px 12px 12px 28px', 
                  border: '1px solid #e5e5e5', 
                  borderRadius: '6px', 
                  fontSize: '16px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#666' }}>
              Original: ${purchase.amount?.toFixed(2) || '0.00'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '20px', borderTop: '1px solid #e5e5e5', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{ padding: '10px 20px', border: '1px solid #e5e5e5', borderRadius: '6px', background: 'white', fontSize: '14px', cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '10px 24px',
              border: 'none',
              borderRadius: '6px',
              background: '#000',
              color: '#fff',
              fontSize: '14px',
              fontWeight: '500',
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.6 : 1
            }}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// ADD TO PROTOCOL MODAL
// ============================================
function AddToProtocolModal({ purchase, onClose, onSuccess }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [protocols, setProtocols] = useState([]);
  const [selectedProtocolId, setSelectedProtocolId] = useState('');
  const [sessionNotes, setSessionNotes] = useState('');

  // Fetch patient's active session-based protocols
  useEffect(() => {
    if (purchase?.ghl_contact_id) {
      fetchProtocols();
    } else {
      setLoading(false);
    }
  }, [purchase]);

  const fetchProtocols = async () => {
    try {
      const res = await fetch(`/api/admin/protocols?ghl_contact_id=${purchase.ghl_contact_id}&status=active`);
      if (res.ok) {
        const data = await res.json();
        const protocolsList = data.protocols || data;
        // Filter to session-based protocols (ones with total_sessions)
        const sessionProtocols = protocolsList.filter(p => 
          p.total_sessions || 
          ['iv_therapy', 'hbot_sessions', 'red_light_sessions', 'injection_pack'].includes(p.program_type)
        );
        setProtocols(sessionProtocols);
      }
    } catch (err) {
      console.error('Error fetching protocols:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSession = async () => {
    if (!selectedProtocolId) {
      setError('Please select a protocol');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/protocol/${selectedProtocolId}/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purchase_id: purchase.id,
          session_date: new Date().toISOString(),
          notes: sessionNotes
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to add session');
      }

      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);
  };

  if (!purchase) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }} onClick={onClose}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '500px',
        margin: '20px'
      }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: '20px', borderBottom: '1px solid #e5e5e5' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Add to Protocol</h2>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#666' }}>
            {purchase.patient_name} • {purchase.item_name} ({formatCurrency(purchase.amount)})
          </p>
        </div>

        {/* Content */}
        <div style={{ padding: '20px' }}>
          {error && (
            <div style={{ padding: '12px', background: '#fef2f2', color: '#991b1b', borderRadius: '6px', fontSize: '14px', marginBottom: '16px' }}>
              {error}
            </div>
          )}

          {loading ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
              Loading protocols...
            </div>
          ) : (
            <>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                  Select Protocol
                </label>
                <select
                  value={selectedProtocolId}
                  onChange={(e) => setSelectedProtocolId(e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: '12px', 
                    border: '1px solid #e5e5e5', 
                    borderRadius: '6px', 
                    fontSize: '14px',
                    background: 'white'
                  }}
                >
                  <option value="">-- Select a protocol --</option>
                  {protocols.length > 0 && (
                    <optgroup label="Active Packs">
                      {protocols.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.program_name || p.program_type} 
                          {p.total_sessions ? ` (${p.injections_completed || 0}/${p.total_sessions} used)` : ''}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  <optgroup label="Other Options">
                    <option value="new_standalone">+ Create Single Session (Standalone)</option>
                    <option value="new_pack">+ Create New Pack</option>
                  </optgroup>
                </select>
              </div>

              {protocols.length === 0 && (
                <div style={{ 
                  padding: '16px', 
                  background: '#fef3c7', 
                  borderRadius: '8px', 
                  fontSize: '14px', 
                  color: '#92400e',
                  marginBottom: '16px'
                }}>
                  ⚠️ No active session packs found for this patient. Select "Create Single Session" or "Create New Pack" below.
                </div>
              )}

              {/* Session Notes */}
              {selectedProtocolId && !selectedProtocolId.startsWith('new_') && (
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                    Session Notes (optional)
                  </label>
                  <textarea
                    value={sessionNotes}
                    onChange={(e) => setSessionNotes(e.target.value)}
                    placeholder="Any notes about this session..."
                    rows={2}
                    style={{ 
                      width: '100%', 
                      padding: '10px 12px', 
                      border: '1px solid #e5e5e5', 
                      borderRadius: '6px', 
                      fontSize: '14px',
                      resize: 'vertical',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '20px', borderTop: '1px solid #e5e5e5', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{ padding: '10px 20px', border: '1px solid #e5e5e5', borderRadius: '6px', background: 'white', fontSize: '14px', cursor: 'pointer' }}
          >
            Cancel
          </button>
          {selectedProtocolId === 'new_standalone' || selectedProtocolId === 'new_pack' ? (
            <button
              onClick={() => {
                onClose();
                // Trigger create protocol with this purchase
                window.dispatchEvent(new CustomEvent('createProtocolFromPurchase', { detail: purchase }));
              }}
              style={{
                padding: '10px 24px',
                border: 'none',
                borderRadius: '6px',
                background: '#000',
                color: '#fff',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Continue to Create
            </button>
          ) : (
            <button
              onClick={handleAddSession}
              disabled={saving || !selectedProtocolId}
              style={{
                padding: '10px 24px',
                border: 'none',
                borderRadius: '6px',
                background: '#000',
                color: '#fff',
                fontSize: '14px',
                fontWeight: '500',
                cursor: saving || !selectedProtocolId ? 'not-allowed' : 'pointer',
                opacity: saving || !selectedProtocolId ? 0.6 : 1
              }}
            >
              {saving ? 'Adding...' : 'Add Session'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper: Determine if purchase is a package or single session
function isPackagePurchase(purchase) {
  if (!purchase) return false;
  const name = (purchase.item_name || '').toLowerCase();
  
  // Packages: quantity > 1, or name contains pack/package
  if (purchase.quantity > 1) return true;
  if (/\d+[\s-]?pack|\d+[\s-]?session|package/i.test(name)) return true;
  
  return false;
}

// Helper: Determine if purchase is session-based (can be added to protocol)
function isSessionPurchase(purchase) {
  if (!purchase) return false;
  const category = purchase.category || '';
  
  // These categories are session-based
  return ['IV Therapy', 'Injection', 'Hyperbaric', 'Red Light'].includes(category);
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================
export default function AdminPurchases() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [initialized, setInitialized] = useState(false);
  
  // Modal state
  const [createProtocolPurchase, setCreateProtocolPurchase] = useState(null);
  const [addToProtocolPurchase, setAddToProtocolPurchase] = useState(null);
  const [editAmountPurchase, setEditAmountPurchase] = useState(null);
  
  // Listen for create protocol event from AddToProtocol modal
  useEffect(() => {
    const handleCreateFromPurchase = (e) => {
      setCreateProtocolPurchase(e.detail);
    };
    window.addEventListener('createProtocolFromPurchase', handleCreateFromPurchase);
    return () => window.removeEventListener('createProtocolFromPurchase', handleCreateFromPurchase);
  }, []);
  
  // Filters
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState('30');

  // Stats
  const [stats, setStats] = useState({ total: 0, revenue: 0 });

  // Initialize from URL params
  useEffect(() => {
    if (router.isReady && !initialized) {
      const { category, search } = router.query;
      if (category && CATEGORIES.includes(category)) {
        setCategoryFilter(category);
      }
      if (search) {
        setSearchQuery(search);
      }
      setInitialized(true);
    }
  }, [router.isReady, router.query]);

  useEffect(() => {
    const stored = localStorage.getItem('adminPassword');
    if (stored) {
      setPassword(stored);
      setIsAuthenticated(true);
    }
  }, []);

  const fetchPurchases = async () => {
    setLoading(true);
    setError('');
    
    try {
      const params = new URLSearchParams();
      if (categoryFilter !== 'All') params.append('category', categoryFilter);
      if (searchQuery) params.append('search', searchQuery);
      if (dateRange !== 'all') params.append('days', dateRange);
      params.append('limit', '500');
      
      const res = await fetch(`/api/admin/purchases?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${password}` }
      });
      
      if (!res.ok) throw new Error('Failed to fetch purchases');
      
      const data = await res.json();
      setPurchases(data.purchases || []);
      setStats({ total: data.total || 0, revenue: data.revenue || 0 });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && initialized) fetchPurchases();
  }, [isAuthenticated, categoryFilter, dateRange, initialized]);

  useEffect(() => {
    if (!isAuthenticated || !initialized) return;
    const timer = setTimeout(() => fetchPurchases(), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch('/api/admin/purchases?limit=1', {
        headers: { 'Authorization': `Bearer ${password}` }
      });
      
      if (res.ok) {
        setIsAuthenticated(true);
        localStorage.setItem('adminPassword', password);
      } else {
        setError('Invalid password');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  const handleProtocolCreated = () => {
    setCreateProtocolPurchase(null);
    setAddToProtocolPurchase(null);
    fetchPurchases();
  };

  const handleSessionAdded = () => {
    setAddToProtocolPurchase(null);
    fetchPurchases();
  };

  const handleAmountEdited = () => {
    setEditAmountPurchase(null);
    fetchPurchases();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', { 
      month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency: 'USD', minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Peptide': { bg: '#e8f5e9', text: '#2e7d32' },
      'Weight Loss': { bg: '#fff3e0', text: '#ef6c00' },
      'IV Therapy': { bg: '#e3f2fd', text: '#1565c0' },
      'Injection': { bg: '#fce4ec', text: '#c2185b' },
      'Labs': { bg: '#f3e5f5', text: '#7b1fa2' },
      'HRT': { bg: '#e0f2f1', text: '#00695c' },
      'Hyperbaric': { bg: '#e8eaf6', text: '#3949ab' },
      'Red Light': { bg: '#ffebee', text: '#c62828' },
      'Consultation': { bg: '#f5f5f5', text: '#616161' }
    };
    return colors[category] || { bg: '#f5f5f5', text: '#616161' };
  };

  // Login screen
  if (!isAuthenticated) {
    return (
      <>
        <Head><title>Admin Login | Range Medical</title></Head>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f5f5f5',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}>
          <form onSubmit={handleLogin} style={{
            background: 'white',
            padding: '40px',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            width: '100%',
            maxWidth: '400px'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <h1 style={{ margin: '0 0 8px', fontSize: '28px', fontWeight: '600' }}>RANGE MEDICAL</h1>
              <p style={{ margin: 0, color: '#666' }}>Admin Dashboard</p>
            </div>
            {error && (
              <div style={{ background: '#ffebee', color: '#c62828', padding: '12px', borderRadius: '4px', marginBottom: '16px', fontSize: '14px' }}>
                {error}
              </div>
            )}
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '16px', marginBottom: '16px', boxSizing: 'border-box' }}
            />
            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '12px', background: 'black', color: 'white',
              border: 'none', borderRadius: '4px', fontSize: '16px', cursor: 'pointer'
            }}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </>
    );
  }

  return (
    <>
      <Head><title>Purchases | Range Medical</title></Head>
      
      {/* Create Protocol Modal */}
      {createProtocolPurchase && (
        <CreateProtocolModal
          purchase={createProtocolPurchase}
          onClose={() => setCreateProtocolPurchase(null)}
          onSuccess={handleProtocolCreated}
        />
      )}
      
      {/* Add to Protocol Modal */}
      {addToProtocolPurchase && (
        <AddToProtocolModal
          purchase={addToProtocolPurchase}
          onClose={() => setAddToProtocolPurchase(null)}
          onSuccess={handleSessionAdded}
        />
      )}
      
      {/* Edit Amount Modal */}
      {editAmountPurchase && (
        <EditAmountModal
          purchase={editAmountPurchase}
          onClose={() => setEditAmountPurchase(null)}
          onSuccess={handleAmountEdited}
        />
      )}
      
      <div style={{
        minHeight: '100vh',
        background: '#f5f5f5',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        {/* Header */}
        <header style={{
          background: 'black',
          color: 'white',
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '600' }}>RANGE MEDICAL</h1>
            <p style={{ margin: '4px 0 0', fontSize: '14px', opacity: 0.8 }}>
              {categoryFilter === 'All' ? 'Purchase History' : `${categoryFilter} Purchases`}
            </p>
          </div>
          <button onClick={() => {
            localStorage.removeItem('adminPassword');
            setIsAuthenticated(false);
          }} style={{
            padding: '8px 16px',
            background: 'transparent',
            color: 'white',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}>
            Logout
          </button>
        </header>

        {/* Navigation */}
        <nav style={{
          background: 'white',
          borderBottom: '1px solid #e0e0e0',
          padding: '0 24px',
          display: 'flex',
          gap: '0'
        }}>
          {[
            { href: '/admin/dashboard', label: 'Dashboard' },
            { href: '/admin/protocols', label: 'Protocols' },
            { href: '/admin/purchases', label: 'Purchases', active: true },
            { href: '/admin/patients', label: 'Patients' }
          ].map(item => (
            <Link key={item.href} href={item.href} style={{
              padding: '16px 20px',
              color: item.active ? 'black' : '#666',
              textDecoration: 'none',
              borderBottom: item.active ? '2px solid black' : '2px solid transparent',
              fontWeight: item.active ? '500' : '400',
              fontSize: '14px'
            }}>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Stats Bar */}
        <div style={{
          background: 'white',
          borderBottom: '1px solid #e0e0e0',
          padding: '16px 24px',
          display: 'flex',
          gap: '32px'
        }}>
          <div>
            <div style={{ fontSize: '24px', fontWeight: '600' }}>{stats.total}</div>
            <div style={{ fontSize: '13px', color: '#666' }}>
              {categoryFilter === 'All' ? 'Purchases' : `${categoryFilter} Purchases`}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: '600' }}>{formatCurrency(stats.revenue)}</div>
            <div style={{ fontSize: '13px', color: '#666' }}>Revenue</div>
          </div>
        </div>

        {/* Filters */}
        <div style={{
          background: 'white',
          borderBottom: '1px solid #e0e0e0',
          padding: '16px 24px',
          display: 'flex',
          gap: '16px',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by patient or item..."
            style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', width: '250px' }}
          />
          
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              const newUrl = e.target.value === 'All' 
                ? '/admin/purchases' 
                : `/admin/purchases?category=${encodeURIComponent(e.target.value)}`;
              router.push(newUrl, undefined, { shallow: true });
            }}
            style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
          >
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
            <option value="all">All time</option>
          </select>

          <button onClick={fetchPurchases} style={{
            padding: '8px 16px',
            background: '#f5f5f5',
            border: '1px solid #ddd',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}>
            Refresh
          </button>
        </div>

        {/* Error */}
        {error && (
          <div style={{ margin: '16px 24px', background: '#ffebee', color: '#c62828', padding: '12px', borderRadius: '4px' }}>
            {error}
          </div>
        )}

        {/* Table */}
        <div style={{ padding: '24px', overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            background: 'white',
            borderRadius: '8px',
            borderCollapse: 'collapse',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#666' }}>Date</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#666' }}>Patient</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#666' }}>Item</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', color: '#666' }}>Qty</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#666' }}>Category</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px', color: '#666' }}>Amount</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#666' }}>Source</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', color: '#666' }}>Protocol</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                    Loading purchases...
                  </td>
                </tr>
              ) : purchases.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                    No purchases found
                  </td>
                </tr>
              ) : (
                purchases.map(purchase => {
                  const catColor = getCategoryColor(purchase.category);
                  return (
                    <tr key={purchase.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '12px 16px', fontSize: '14px' }}>
                        {formatDate(purchase.purchase_date)}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: '500', fontSize: '14px' }}>{purchase.patient_name}</div>
                        <div style={{ fontSize: '12px', color: '#666' }}>{purchase.patient_email || '-'}</div>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '14px', maxWidth: '300px' }}>
                        {purchase.item_name}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '14px', textAlign: 'center', fontWeight: purchase.quantity > 1 ? '600' : '400' }}>
                        {purchase.quantity || 1}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '500',
                          background: catColor.bg,
                          color: catColor.text
                        }}>
                          {purchase.category}
                        </span>
                      </td>
                      <td 
                        onClick={() => setEditAmountPurchase(purchase)}
                        style={{ 
                          padding: '12px 16px', 
                          fontSize: '14px', 
                          textAlign: 'right', 
                          fontWeight: '500',
                          cursor: 'pointer',
                          position: 'relative'
                        }}
                        title="Click to edit amount"
                      >
                        {formatCurrency(purchase.amount)}
                        <span style={{ 
                          marginLeft: '6px', 
                          fontSize: '10px', 
                          color: '#999',
                          opacity: 0.5
                        }}>✎</span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '12px', color: '#666' }}>
                        {purchase.source || '-'}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        {purchase.protocol_id ? (
                          <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: '500' }}>✓ Assigned</span>
                        ) : isPackagePurchase(purchase) ? (
                          <button
                            onClick={() => setCreateProtocolPurchase(purchase)}
                            style={{
                              padding: '6px 12px',
                              background: '#000',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: '500',
                              cursor: 'pointer'
                            }}
                          >
                            Create Protocol
                          </button>
                        ) : isSessionPurchase(purchase) ? (
                          <button
                            onClick={() => setAddToProtocolPurchase(purchase)}
                            style={{
                              padding: '6px 12px',
                              background: '#3b82f6',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: '500',
                              cursor: 'pointer'
                            }}
                          >
                            Add to Protocol
                          </button>
                        ) : (
                          <button
                            onClick={() => setCreateProtocolPurchase(purchase)}
                            style={{
                              padding: '6px 12px',
                              background: '#000',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: '500',
                              cursor: 'pointer'
                            }}
                          >
                            Create Protocol
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
