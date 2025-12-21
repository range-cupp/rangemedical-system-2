// /pages/admin/purchases.js
// Purchase History Dashboard - With Create Protocol
// Range Medical
//
// ============================================
// FEATURES CHECKLIST - DO NOT REMOVE:
// ============================================
// □ Purchase table with filters (category, search, date range)
// □ Create Protocol modal (from purchase, with templates)
// □ Add to Existing Protocol modal (extend/add sessions)
// □ Edit Amount modal (for discount tracking)
// □ Delete purchase button
// □ Link Contacts button (batch link purchases to GHL contacts)
// □ Patient name links to patient profile
// □ Category badges with colors
// □ Stats summary (total purchases, revenue)
// ============================================

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
// PROGRAM TYPES (matching protocols page)
// ============================================
const PROGRAM_TYPES = [
  // Peptide Programs
  { value: 'recovery_jumpstart_10day', label: 'Peptide Recovery Jumpstart – 10 Day', category: 'Peptide', duration: 10 },
  { value: 'month_program_30day', label: 'Peptide Month Program – 30 Day', category: 'Peptide', duration: 30 },
  { value: 'maintenance_4week', label: 'Peptide Maintenance – 4-Week Refill', category: 'Peptide', duration: 28 },
  { value: 'injection_clinic', label: 'Peptide Injection (In-Clinic)', category: 'Peptide', duration: 1 },
  // Weight Loss Programs
  { value: 'weight_loss_program', label: 'Weight Loss Program (Monthly)', category: 'Weight Loss', duration: 28 },
  { value: 'weight_loss_injection', label: 'Weight Loss Injection', category: 'Weight Loss', duration: 7 },
  // HRT Programs
  { value: 'hrt_male_membership', label: 'Male HRT Membership (Monthly)', category: 'HRT', duration: 28 },
  { value: 'hrt_female_membership', label: 'Female HRT Membership (Monthly)', category: 'HRT', duration: 28 },
  { value: 'hrt_injection', label: 'HRT Injection (In-Clinic)', category: 'HRT', duration: 7 },
  // Medical Injections
  { value: 'injection_medical', label: 'Injection - Medical', category: 'Medical', duration: 1 },
  // Session-based
  { value: 'iv_therapy', label: 'IV Therapy', category: 'Sessions', duration: null },
  { value: 'injection_pack', label: 'Injection Pack', category: 'Sessions', duration: null },
  { value: 'hbot_sessions', label: 'Hyperbaric Oxygen Therapy', category: 'Sessions', duration: null },
  { value: 'red_light_sessions', label: 'Red Light Therapy', category: 'Sessions', duration: null }
];

const FREQUENCY_OPTIONS = [
  { value: '2x_daily', label: '2x Daily (AM & PM)' },
  { value: 'daily', label: 'Daily' },
  { value: '5_on_2_off', label: '5 Days On / 2 Days Off' },
  { value: 'every_other_day', label: 'Every Other Day' },
  { value: '3x_weekly', label: '3x Weekly (Mon, Wed, Fri)' },
  { value: '2x_weekly', label: '2x Weekly (Mon & Thu)' },
  { value: 'weekly', label: 'Weekly' }
];

// ============================================
// CREATE PROTOCOL MODAL (Enhanced)
// ============================================
function CreateProtocolModal({ purchase, onClose, onSuccess, peptides = [] }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Group peptides by category
  const peptidesByCategory = peptides.reduce((acc, p) => {
    const cat = p.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {});

  // Determine initial program type based on purchase category
  const getInitialProgramType = () => {
    const cat = purchase?.category;
    if (cat === 'Peptide') return 'recovery_jumpstart_10day';
    if (cat === 'Weight Loss') return 'weight_loss_program';
    if (cat === 'IV Therapy') return 'iv_therapy';
    if (cat === 'Injection') return 'injection_pack';
    if (cat === 'Hyperbaric') return 'hbot_sessions';
    if (cat === 'Red Light') return 'red_light_sessions';
    return 'recovery_jumpstart_10day';
  };

  const initialProgramType = getInitialProgramType();
  const initialProgram = PROGRAM_TYPES.find(p => p.value === initialProgramType);

  const [formData, setFormData] = useState({
    patient_name: purchase?.patient_name || '',
    patient_email: purchase?.patient_email || '',
    patient_phone: purchase?.patient_phone || '',
    ghl_contact_id: purchase?.ghl_contact_id || '',
    program_type: initialProgramType,
    program_name: initialProgram?.label || '',
    injection_location: initialProgram?.category === 'Sessions' ? 'in_clinic' : 'take_home',
    duration_days: initialProgram?.duration || 10,
    total_sessions: purchase?.quantity > 1 ? purchase.quantity : null,
    primary_peptide: '',
    secondary_peptide: '',
    dose_amount: '',
    dose_frequency: '',
    start_date: new Date().toISOString().split('T')[0],
    special_instructions: '',
    notes: '',
    reminders_enabled: initialProgram?.category !== 'Sessions'
  });

  // Update form when program type changes
  const handleProgramTypeChange = (value) => {
    const program = PROGRAM_TYPES.find(p => p.value === value);
    if (program) {
      setFormData(prev => ({
        ...prev,
        program_type: value,
        program_name: program.label,
        duration_days: program.duration || prev.duration_days,
        injection_location: program.category === 'Sessions' ? 'in_clinic' : prev.injection_location,
        reminders_enabled: program.category !== 'Sessions'
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
    // Client-side validation
    if (!formData.patient_name?.trim()) {
      setError('Patient name is required');
      return;
    }
    if (!formData.program_type) {
      setError('Program type is required');
      return;
    }
    if (!formData.dose_frequency) {
      setError('Frequency is required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/protocols', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ghl_contact_id: formData.ghl_contact_id || null,
          patient_name: formData.patient_name,
          patient_email: formData.patient_email,
          patient_phone: formData.patient_phone,
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
          notes: formData.notes,
          reminders_enabled: formData.reminders_enabled,
          status: 'active',
          amount: purchase.amount
        })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.details || data.error || 'Failed to create protocol');
      }

      onSuccess();
    } catch (err) {
      console.error('Protocol creation error:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!purchase) return null;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);
  };

  const isPeptideProgram = ['recovery_jumpstart_10day', 'month_program_30day', 'maintenance_4week', 'injection_clinic'].includes(formData.program_type);
  const isWeightLoss = ['weight_loss_program', 'weight_loss_injection'].includes(formData.program_type);
  const isHRT = ['hrt_male_membership', 'hrt_female_membership', 'hrt_injection'].includes(formData.program_type);
  const isMedical = ['injection_medical'].includes(formData.program_type);

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
        borderRadius: '8px',
        width: '100%',
        maxWidth: '700px',
        maxHeight: '90vh',
        overflow: 'auto',
        margin: '20px'
      }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #e0e0e0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'black',
          color: 'white',
          borderRadius: '8px 8px 0 0'
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Create Protocol</h2>
            <p style={{ margin: '4px 0 0', fontSize: '13px', opacity: 0.8 }}>
              {purchase.item_name}{purchase.quantity > 1 && ` ×${purchase.quantity}`} ({formatCurrency(purchase.amount)})
            </p>
          </div>
          <button onClick={onClose} style={{
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: 'white',
            lineHeight: 1
          }}>
            ×
          </button>
        </div>

        {/* Form */}
        <div style={{ padding: '20px' }}>
          {error && (
            <div style={{ padding: '12px', background: '#ffebee', color: '#c62828', borderRadius: '6px', fontSize: '14px', marginBottom: '16px' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* Missing Data Notice */}
            {(!purchase?.patient_name || !purchase?.ghl_contact_id) && (
              <div style={{ 
                gridColumn: '1 / -1', 
                background: '#eff6ff', 
                border: '1px solid #bfdbfe', 
                borderRadius: '6px', 
                padding: '12px 16px',
                marginBottom: '8px'
              }}>
                <div style={{ fontSize: '13px', color: '#1e40af' }}>
                  ℹ️ Some data is missing from this purchase record. Please fill in the required fields below.
                </div>
              </div>
            )}

            {/* Patient Info */}
            <div style={{ gridColumn: '1 / -1' }}>
              <h3 style={{ margin: '0 0 12px', fontSize: '14px', color: '#666', fontWeight: '600' }}>Patient Information</h3>
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: '#333', fontWeight: '500' }}>
                Patient Name *
              </label>
              <input
                type="text"
                value={formData.patient_name}
                onChange={(e) => setFormData({ ...formData, patient_name: e.target.value })}
                required
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: '#333', fontWeight: '500' }}>
                Email
              </label>
              <input
                type="email"
                value={formData.patient_email}
                onChange={(e) => setFormData({ ...formData, patient_email: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: '#333', fontWeight: '500' }}>
                Phone
              </label>
              <input
                type="tel"
                value={formData.patient_phone}
                onChange={(e) => setFormData({ ...formData, patient_phone: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: '#333', fontWeight: '500' }}>
                GHL Contact ID
              </label>
              <input
                type="text"
                value={formData.ghl_contact_id}
                onChange={(e) => setFormData({ ...formData, ghl_contact_id: e.target.value })}
                placeholder="Optional"
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>

            {/* Program Info */}
            <div style={{ gridColumn: '1 / -1', marginTop: '8px' }}>
              <h3 style={{ margin: '0 0 12px', fontSize: '14px', color: '#666', fontWeight: '600' }}>Program Details</h3>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: '#333', fontWeight: '500' }}>
                Program Type *
              </label>
              <select
                value={formData.program_type}
                onChange={(e) => handleProgramTypeChange(e.target.value)}
                required
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' }}
              >
                <optgroup label="Peptide Programs">
                  {PROGRAM_TYPES.filter(t => t.category === 'Peptide').map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </optgroup>
                <optgroup label="Weight Loss Programs">
                  {PROGRAM_TYPES.filter(t => t.category === 'Weight Loss').map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </optgroup>
                <optgroup label="HRT Programs">
                  {PROGRAM_TYPES.filter(t => t.category === 'HRT').map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </optgroup>
                <optgroup label="Medical Injections">
                  {PROGRAM_TYPES.filter(t => t.category === 'Medical').map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </optgroup>
                <optgroup label="Session-Based">
                  {PROGRAM_TYPES.filter(t => t.category === 'Sessions').map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: '#333', fontWeight: '500' }}>
                Program Name
              </label>
              <input
                type="text"
                value={formData.program_name}
                onChange={(e) => setFormData({ ...formData, program_name: e.target.value })}
                placeholder="e.g., BPC-157 Recovery Program"
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: '#333', fontWeight: '500' }}>
                Start Date
              </label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: '#333', fontWeight: '500' }}>
                Duration (Days)
              </label>
              <input
                type="number"
                value={formData.duration_days || ''}
                onChange={(e) => setFormData({ ...formData, duration_days: parseInt(e.target.value) || null })}
                min="1"
                max="365"
                placeholder="Ongoing"
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>

            {/* Medication Selection - show for peptide/weight loss/HRT/Medical programs */}
            {(isPeptideProgram || isWeightLoss || isHRT || isMedical) && (
              <>
                <div style={{ gridColumn: '1 / -1', marginTop: '8px' }}>
                  <h3 style={{ margin: '0 0 12px', fontSize: '14px', color: '#666', fontWeight: '600' }}>
                    Medication Selection
                  </h3>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: '#333', fontWeight: '500' }}>
                    Primary Medication
                  </label>
                  <select
                    value={formData.primary_peptide}
                    onChange={(e) => setFormData({ ...formData, primary_peptide: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' }}
                  >
                    <option value="">-- Select --</option>
                    {Object.entries(peptidesByCategory).map(([category, items]) => (
                      <optgroup key={category} label={category}>
                        {items.map(p => (
                          <option key={p.id || p.name} value={p.name}>{p.name}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: '#333', fontWeight: '500' }}>
                    Secondary Medication
                  </label>
                  <select
                    value={formData.secondary_peptide}
                    onChange={(e) => setFormData({ ...formData, secondary_peptide: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' }}
                  >
                    <option value="">-- None --</option>
                    {Object.entries(peptidesByCategory).map(([category, items]) => (
                      <optgroup key={category} label={category}>
                        {items.map(p => (
                          <option key={p.id || p.name} value={p.name}>{p.name}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
              </>
            )}

            {/* Dosing */}
            <div style={{ gridColumn: '1 / -1', marginTop: '8px' }}>
              <h3 style={{ margin: '0 0 12px', fontSize: '14px', color: '#666', fontWeight: '600' }}>Dosing Schedule</h3>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: '#333', fontWeight: '500' }}>
                Dose Amount
              </label>
              <input
                type="text"
                value={formData.dose_amount}
                onChange={(e) => setFormData({ ...formData, dose_amount: e.target.value })}
                placeholder="e.g., 500mcg or 0.5ml"
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: '#333', fontWeight: '500' }}>
                Frequency *
              </label>
              <select
                value={formData.dose_frequency}
                onChange={(e) => setFormData({ ...formData, dose_frequency: e.target.value })}
                required
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' }}
              >
                <option value="">-- Select Frequency --</option>
                {FREQUENCY_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: '#333', fontWeight: '500' }}>
                Special Instructions
              </label>
              <textarea
                value={formData.special_instructions}
                onChange={(e) => setFormData({ ...formData, special_instructions: e.target.value })}
                rows={3}
                placeholder="Instructions visible to patient..."
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box', resize: 'vertical' }}
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: '#333', fontWeight: '500' }}>
                Internal Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
                placeholder="Staff-only notes..."
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box', resize: 'vertical' }}
              />
            </div>

            {/* Reminders */}
            <div style={{ gridColumn: '1 / -1', background: '#f9f9f9', padding: '16px', borderRadius: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.reminders_enabled}
                  onChange={(e) => setFormData({ ...formData, reminders_enabled: e.target.checked })}
                  style={{ width: '18px', height: '18px' }}
                />
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '500' }}>Enable Injection Reminders</div>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                    {formData.dose_frequency === '2x_daily' 
                      ? 'Patient receives reminders at 8:00 AM & 6:30 PM on injection days'
                      : formData.dose_frequency === '2x_weekly'
                      ? 'Patient receives reminders at 6:30 PM on Monday & Thursday'
                      : formData.dose_frequency === 'every_other_day'
                      ? 'Patient receives reminders at 6:30 PM on alternating days'
                      : formData.dose_frequency === 'weekly'
                      ? 'Patient receives weekly reminder at 6:30 PM'
                      : 'Patient receives daily reminder at 6:30 PM if no injection logged'}
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Submit buttons */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            marginTop: '24px',
            paddingTop: '20px',
            borderTop: '1px solid #e0e0e0'
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 20px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                background: 'white',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving || !formData.patient_name}
              style={{
                padding: '10px 24px',
                border: 'none',
                borderRadius: '6px',
                background: saving ? '#ccc' : '#000',
                color: 'white',
                fontSize: '14px',
                fontWeight: '500',
                cursor: saving ? 'wait' : 'pointer'
              }}
            >
              {saving ? 'Creating...' : 'Create Protocol'}
            </button>
          </div>
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
        method: 'PUT',
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

  const needsReview = purchase.list_price && purchase.list_price === purchase.amount;

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
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Edit Amount Paid</h2>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#666' }}>
            {purchase.patient_name} • {purchase.item_name}
          </p>
        </div>

        {/* Content */}
        <div style={{ padding: '20px' }}>
          {needsReview && (
            <div style={{ padding: '12px', background: '#fef3c7', color: '#92400e', borderRadius: '6px', fontSize: '13px', marginBottom: '16px' }}>
              ⚠️ Amount equals list price. Please verify this is the actual amount paid after any discounts.
            </div>
          )}

          {error && (
            <div style={{ padding: '12px', background: '#fef2f2', color: '#991b1b', borderRadius: '6px', fontSize: '14px', marginBottom: '16px' }}>
              {error}
            </div>
          )}

          {/* Price Reference */}
          {purchase.list_price && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              padding: '12px', 
              background: '#f9f9f9', 
              borderRadius: '6px', 
              marginBottom: '16px',
              fontSize: '14px'
            }}>
              <span style={{ color: '#666' }}>List Price:</span>
              <span style={{ fontWeight: '500' }}>${purchase.list_price?.toFixed(2)}</span>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
              Actual Amount Paid
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
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave();
                  if (e.key === 'Escape') onClose();
                }}
                autoFocus
                style={{ 
                  width: '100%', 
                  padding: '12px 12px 12px 28px', 
                  border: '2px solid #000', 
                  borderRadius: '6px', 
                  fontSize: '16px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#666' }}>
              Current saved: ${purchase.amount?.toFixed(2) || '0.00'}
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
  const [extensionDays, setExtensionDays] = useState(30);

  // Determine if this is a duration-based extension (weight loss, peptide, HRT) vs session-based
  const isDurationExtension = ['Weight Loss', 'Peptide', 'HRT'].includes(purchase?.category);

  // Fetch patient's active protocols
  useEffect(() => {
    if (purchase?.ghl_contact_id) {
      fetchProtocols();
    } else {
      setLoading(false);
    }
  }, [purchase]);

  const fetchProtocols = async () => {
    try {
      const res = await fetch(`/api/admin/protocols?ghl_contact_id=${purchase.ghl_contact_id}&status=active,ready_refill`);
      if (res.ok) {
        const data = await res.json();
        const protocolsList = data.protocols || data;
        
        // Filter based on purchase category
        let filtered = protocolsList;
        if (isDurationExtension) {
          // For weight loss/peptide/HRT - show matching program types
          const categoryMap = {
            'Weight Loss': ['weight_loss', 'weight_loss_program', 'weight_loss_injection'],
            'Peptide': ['recovery_jumpstart_10day', 'month_program_30day', 'maintenance_4week', 'month_30day', 'jumpstart_10day', 'recovery_10day'],
            'HRT': ['hrt', 'hrt_male_membership', 'hrt_female_membership', 'hrt_injection']
          };
          const validTypes = categoryMap[purchase.category] || [];
          filtered = protocolsList.filter(p => 
            validTypes.some(t => (p.program_type || '').toLowerCase().includes(t.toLowerCase()))
          );
        } else {
          // For sessions - filter to session-based protocols
          filtered = protocolsList.filter(p => 
            p.total_sessions || 
            ['iv_therapy', 'hbot_sessions', 'red_light_sessions', 'injection_pack'].includes(p.program_type)
          );
        }
        setProtocols(filtered);
      }
    } catch (err) {
      console.error('Error fetching protocols:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToProtocol = async () => {
    if (!selectedProtocolId) {
      setError('Please select a protocol');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (isDurationExtension) {
        // Extend protocol duration
        const selectedProtocol = protocols.find(p => p.id === selectedProtocolId);
        const currentEndDate = selectedProtocol?.end_date ? new Date(selectedProtocol.end_date) : new Date();
        const newEndDate = new Date(currentEndDate);
        newEndDate.setDate(newEndDate.getDate() + extensionDays);
        
        const newDuration = (selectedProtocol?.duration_days || 0) + extensionDays;

        const res = await fetch(`/api/admin/protocols?id=${selectedProtocolId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            duration_days: newDuration,
            end_date: newEndDate.toISOString().split('T')[0],
            notes: `${selectedProtocol?.notes || ''}\n[${new Date().toLocaleDateString()}] Extended ${extensionDays} days - ${purchase.item_name}${sessionNotes ? ` - ${sessionNotes}` : ''}`
          })
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to extend protocol');
        }

        // Link purchase to protocol
        await fetch(`/api/admin/purchases/${purchase.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ protocol_id: selectedProtocolId })
        });

      } else {
        // Add session to protocol
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

  const selectedProtocol = protocols.find(p => p.id === selectedProtocolId);

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
        <div style={{ padding: '20px', borderBottom: '1px solid #e5e5e5', background: '#3b82f6', borderRadius: '12px 12px 0 0' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: 'white' }}>
            {isDurationExtension ? 'Extend Protocol' : 'Add to Protocol'}
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>
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

          {loading ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
              Loading protocols...
            </div>
          ) : (
            <>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                  Select Protocol to {isDurationExtension ? 'Extend' : 'Add Session'}
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
                  {protocols.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.program_name || p.program_type} 
                      {p.end_date ? ` (ends ${new Date(p.end_date).toLocaleDateString()})` : ''}
                      {p.total_sessions ? ` (${p.injections_completed || 0}/${p.total_sessions} used)` : ''}
                    </option>
                  ))}
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
                  ⚠️ No matching active protocols found for this patient. Use "+ New" to create a new protocol instead.
                </div>
              )}

              {/* Extension Days (for Weight Loss/Peptide/HRT) */}
              {selectedProtocolId && isDurationExtension && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                    Extend by (days)
                  </label>
                  <select
                    value={extensionDays}
                    onChange={(e) => setExtensionDays(parseInt(e.target.value))}
                    style={{ 
                      width: '100%', 
                      padding: '12px', 
                      border: '1px solid #e5e5e5', 
                      borderRadius: '6px', 
                      fontSize: '14px',
                      background: 'white'
                    }}
                  >
                    <option value={7}>7 days (1 week)</option>
                    <option value={14}>14 days (2 weeks)</option>
                    <option value={28}>28 days (4 weeks)</option>
                    <option value={30}>30 days (1 month)</option>
                    <option value={60}>60 days (2 months)</option>
                    <option value={90}>90 days (3 months)</option>
                  </select>
                  {selectedProtocol && (
                    <div style={{ marginTop: '8px', fontSize: '13px', color: '#666' }}>
                      Current end: {selectedProtocol.end_date ? new Date(selectedProtocol.end_date).toLocaleDateString() : 'Not set'} → 
                      New end: {(() => {
                        const current = selectedProtocol.end_date ? new Date(selectedProtocol.end_date) : new Date();
                        current.setDate(current.getDate() + extensionDays);
                        return current.toLocaleDateString();
                      })()}
                    </div>
                  )}
                </div>
              )}

              {/* Notes */}
              {selectedProtocolId && (
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                    Notes (optional)
                  </label>
                  <textarea
                    value={sessionNotes}
                    onChange={(e) => setSessionNotes(e.target.value)}
                    placeholder={isDurationExtension ? "Any notes about this renewal..." : "Any notes about this session..."}
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
          <button
            onClick={handleAddToProtocol}
            disabled={!selectedProtocolId || saving}
            style={{ 
              padding: '10px 20px', 
              background: !selectedProtocolId || saving ? '#ccc' : '#3b82f6', 
              color: 'white', 
              border: 'none', 
              borderRadius: '6px', 
              fontSize: '14px', 
              fontWeight: '500',
              cursor: !selectedProtocolId || saving ? 'not-allowed' : 'pointer'
            }}
          >
            {saving ? 'Saving...' : isDurationExtension ? `Extend ${extensionDays} Days` : 'Add Session'}
          </button>
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
  
  // These categories are session-based or can extend existing protocols
  return ['IV Therapy', 'Injection', 'Hyperbaric', 'Red Light', 'Weight Loss', 'Peptide', 'HRT'].includes(category);
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================
export default function AdminPurchases() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [purchases, setPurchases] = useState([]);
  const [peptides, setPeptides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [initialized, setInitialized] = useState(false);
  
  // Modal state
  const [createProtocolPurchase, setCreateProtocolPurchase] = useState(null);
  const [addToProtocolPurchase, setAddToProtocolPurchase] = useState(null);
  const [editAmountPurchase, setEditAmountPurchase] = useState(null);
  const [deletingPurchase, setDeletingPurchase] = useState(null);
  const [deleting, setDeleting] = useState(false);
  
  // Fetch peptides for dropdown
  const fetchPeptides = async () => {
    try {
      const res = await fetch('/api/admin/peptides');
      if (res.ok) {
        const data = await res.json();
        setPeptides(data.peptides || []);
      }
    } catch (err) {
      console.error('Failed to fetch peptides:', err);
    }
  };
  
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
  const [linking, setLinking] = useState(false);
  const [linkResult, setLinkResult] = useState(null);
  const [showNeedsReview, setShowNeedsReview] = useState(false);

  // Stats
  const [stats, setStats] = useState({ total: 0, revenue: 0 });

  // Delete purchase
  const handleDeletePurchase = async (purchase) => {
    if (!confirm(`Delete "${purchase.item_name}" for ${purchase.patient_name}?\n\nThis cannot be undone.`)) {
      return;
    }
    
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/purchases/${purchase.id}`, {
        method: 'DELETE'
      });
      
      if (res.ok) {
        setPurchases(purchases.filter(p => p.id !== purchase.id));
      } else {
        const data = await res.json();
        alert('Error: ' + (data.error || 'Failed to delete purchase'));
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setDeleting(false);
    }
  };

  // Link purchases to contacts
  const handleLinkContacts = async () => {
    if (!confirm('This will match purchases to patients and fill in missing GHL Contact ID, email, and phone. Continue?')) {
      return;
    }
    
    setLinking(true);
    setLinkResult(null);
    
    try {
      const res = await fetch('/api/admin/purchases/link-contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setLinkResult(data);
        if (data.updated > 0) {
          fetchPurchases(); // Refresh the list
        }
        alert(`Linked ${data.updated} purchases to contacts. ${data.skipped} skipped (no match or already complete).`);
      } else {
        alert('Error: ' + (data.error || 'Failed to link contacts'));
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setLinking(false);
    }
  };

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
    if (isAuthenticated && initialized) {
      fetchPurchases();
      fetchPeptides();
    }
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
          peptides={peptides}
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

          <button
            onClick={() => setShowNeedsReview(!showNeedsReview)}
            style={{
              padding: '8px 16px',
              background: showNeedsReview ? '#fef3c7' : '#f5f5f5',
              border: showNeedsReview ? '2px solid #f59e0b' : '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: showNeedsReview ? '600' : '400',
              color: showNeedsReview ? '#b45309' : '#333'
            }}
          >
            ⚠️ Needs Review ({purchases.filter(p => p.list_price && p.list_price === p.amount).length})
          </button>

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

          <button 
            onClick={handleLinkContacts} 
            disabled={linking}
            style={{
              padding: '8px 16px',
              background: linking ? '#ccc' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: linking ? 'not-allowed' : 'pointer',
              fontSize: '14px'
            }}
          >
            {linking ? 'Linking...' : '🔗 Link Contacts'}
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
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px', color: '#666' }}>Price</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px', color: '#666' }}>Paid</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#666' }}>Source</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', color: '#666' }}>Protocol</th>
                <th style={{ padding: '12px 8px', textAlign: 'center', fontSize: '13px', color: '#666' }}></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="10" style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                    Loading purchases...
                  </td>
                </tr>
              ) : purchases.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                    No purchases found
                  </td>
                </tr>
              ) : (
                purchases
                  .filter(p => !showNeedsReview || (p.list_price && p.list_price === p.amount))
                  .map(purchase => {
                  const catColor = getCategoryColor(purchase.category);
                  const needsReview = purchase.list_price && purchase.list_price === purchase.amount;
                  return (
                    <tr key={purchase.id} style={{ 
                      borderBottom: '1px solid #f0f0f0',
                      background: needsReview ? '#fffbeb' : 'transparent'
                    }}>
                      <td style={{ padding: '12px 16px', fontSize: '14px' }}>
                        {formatDate(purchase.purchase_date)}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {purchase.ghl_contact_id ? (
                          <a 
                            href={`/admin/patient/${purchase.ghl_contact_id}`}
                            style={{ fontWeight: '500', fontSize: '14px', color: '#1565c0', textDecoration: 'none' }}
                          >
                            {purchase.patient_name}
                          </a>
                        ) : (
                          <div style={{ fontWeight: '500', fontSize: '14px' }}>{purchase.patient_name}</div>
                        )}
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
                      <td style={{ padding: '12px 16px', fontSize: '14px', textAlign: 'right', color: '#666' }}>
                        {purchase.list_price ? formatCurrency(purchase.list_price) : '-'}
                      </td>
                      <td 
                        onClick={() => setEditAmountPurchase(purchase)}
                        style={{ 
                          padding: '12px 16px', 
                          fontSize: '14px', 
                          textAlign: 'right', 
                          fontWeight: '500',
                          cursor: 'pointer',
                          position: 'relative',
                          // Orange if amount equals list_price (likely needs review)
                          // Green if different (discount applied/verified)
                          // Black if no list_price
                          background: purchase.list_price && purchase.list_price === purchase.amount ? '#fef3c7' : 'transparent',
                          color: purchase.list_price 
                            ? (purchase.list_price === purchase.amount ? '#b45309' : '#16a34a')
                            : '#000'
                        }}
                        title={purchase.list_price && purchase.list_price === purchase.amount 
                          ? "⚠️ Amount equals list price - click to verify/edit" 
                          : "Click to edit amount"}
                      >
                        {formatCurrency(purchase.amount)}
                        {purchase.list_price && purchase.list_price !== purchase.amount && (
                          <span style={{ 
                            marginLeft: '4px', 
                            fontSize: '10px', 
                            color: '#16a34a',
                            fontWeight: '400'
                          }}>✓</span>
                        )}
                        {purchase.list_price && purchase.list_price === purchase.amount && (
                          <span style={{ 
                            marginLeft: '4px', 
                            fontSize: '10px', 
                            color: '#b45309',
                            fontWeight: '400'
                          }}>⚠</span>
                        )}
                        <span style={{ 
                          marginLeft: '4px', 
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
                        ) : (
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button
                              onClick={() => setCreateProtocolPurchase(purchase)}
                              style={{
                                padding: '6px 10px',
                                background: '#000',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: '500',
                                cursor: 'pointer'
                              }}
                            >
                              + New
                            </button>
                            {isSessionPurchase(purchase) && (
                              <button
                                onClick={() => setAddToProtocolPurchase(purchase)}
                                style={{
                                  padding: '6px 10px',
                                  background: '#3b82f6',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: '4px',
                                  fontSize: '11px',
                                  fontWeight: '500',
                                  cursor: 'pointer'
                                }}
                              >
                                + Existing
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                        <button
                          onClick={() => handleDeletePurchase(purchase)}
                          disabled={deleting}
                          style={{
                            padding: '4px 8px',
                            background: 'transparent',
                            color: '#dc2626',
                            border: '1px solid #fecaca',
                            borderRadius: '4px',
                            fontSize: '11px',
                            cursor: deleting ? 'wait' : 'pointer',
                            opacity: deleting ? 0.5 : 1
                          }}
                          title="Delete purchase"
                        >
                          🗑️
                        </button>
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
