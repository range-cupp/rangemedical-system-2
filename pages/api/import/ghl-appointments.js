// /pages/api/import/ghl-appointments.js
// Import GHL appointment CSV data — matches patients by name, avoids duplicates

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Map GHL service names to system service names, categories, and durations
const SERVICE_MAP = {
  'Injection - Weight Loss': { name: 'Weight Loss Injection', category: 'weight_loss', duration: 15 },
  'Injection - Testosterone': { name: 'Testosterone Injection', category: 'hrt', duration: 15 },
  'Injection - Medical': { name: 'Range Injections', category: 'injection', duration: 15 },
  'Injection - Peptide': { name: 'Peptide Injection', category: 'peptide', duration: 15 },
  'Range Injections': { name: 'Range Injections', category: 'injection', duration: 15 },
  'Initial Lab Review': { name: 'Initial Lab Review', category: 'labs', duration: 30 },
  'Follow Up Lab Review': { name: 'Follow-Up Lab Review', category: 'labs', duration: 20 },
  'New Patient Blood Draw': { name: 'New Patient Blood Draw', category: 'labs', duration: 30 },
  'Follow Up Blood Draw': { name: 'Follow-Up Blood Draw', category: 'labs', duration: 15 },
  'Range IV': { name: 'Range IV', category: 'iv', duration: 45 },
  'Red Light Therapy': { name: 'Red Light Therapy', category: 'rlt', duration: 20 },
  'Hyperbaric Oxygen Therapy': { name: 'HBOT Session', category: 'hbot', duration: 60 },
  'Initial Consultation': { name: 'Initial Consultation', category: 'other', duration: 45 },
  'Initial Consultation - Peptide': { name: 'Initial Consultation', category: 'peptide', duration: 45 },
  'Follow-Up Consultation': { name: 'Follow-Up Consultation', category: 'other', duration: 30 },
  'Medication Pickup': { name: 'Medication Pickup', category: 'other', duration: 15 },
  'Testosterone Pellet Procedure': { name: 'Testosterone Pellet Procedure', category: 'hrt', duration: 30 },
  'BYO - IV': { name: 'Specialty IV', category: 'iv', duration: 60 },
  'Methylene Blue IV': { name: 'Specialty IV', category: 'iv', duration: 60 },
  'High Dose Vitamin C IV': { name: 'Specialty IV', category: 'iv', duration: 120 },
  'High Dose Vitamin C IV (25g)': { name: 'Specialty IV', category: 'iv', duration: 120 },
  'NAD+ Injection (100mg)': { name: 'NAD+ Injection', category: 'injection', duration: 15 },
  'NAD+ Injection (75mg)': { name: 'NAD+ Injection', category: 'injection', duration: 15 },
  'NAD+ Injection (50mg)': { name: 'NAD+ Injection', category: 'injection', duration: 15 },
  'NAD+ IV (500mg)': { name: 'NAD+ IV 500mg', category: 'iv', duration: 180 },
  'NAD+ IV': { name: 'NAD+ IV 250mg', category: 'iv', duration: 120 },
  'Conversation - Range Team': { name: 'Phone Consultation', category: 'other', duration: 15 },
  'The Range Assesment': { name: 'Initial Consultation', category: 'other', duration: 30 },
  'The Recovery Assessment': { name: 'Initial Consultation', category: 'other', duration: 30 },
  'Therapeutic Phlebotomy': { name: 'Therapeutic Phlebotomy', category: 'labs', duration: 30 },
  'Peptide Follow Up': { name: 'Follow-Up Consultation', category: 'peptide', duration: 30 },
  'PRP Injection': { name: 'PRP Injection', category: 'injection', duration: 30 },
  'DEXA Scan': { name: 'DEXA Scan', category: 'other', duration: 30 },
  'Exosome IV Therapy': { name: 'Specialty IV', category: 'iv', duration: 60 },
};

// Map GHL status to system status
const STATUS_MAP = {
  'showed': 'completed',
  'confirmed': 'confirmed',
  'cancelled': 'cancelled',
  'invalid': 'cancelled',
  'noshow': 'no_show',
};

function parseCSV(csvText) {
  const lines = csvText.split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    // Simple CSV parse — handle quoted values
    const values = [];
    let current = '';
    let inQuotes = false;
    for (let j = 0; j < line.length; j++) {
      const ch = line[j];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    values.push(current.trim());

    if (values.length >= 9) {
      rows.push({
        contactName: values[0],
        status: values[1],
        title: values[2],
        requestedTime: values[3],
        createdOn: values[4],
        calendarName: values[5],
        appointmentOwner: values[6],
        rescheduled: values[7],
        service: values[8].trim(),
        serviceCategory: values[9] || '',
      });
    }
  }
  return rows;
}

function parseGHLDate(dateStr) {
  if (!dateStr) return null;
  // Format: "Mar 06 2026 12:00 PM"
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return d;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { csvData, dryRun = false } = req.body;
    if (!csvData) {
      return res.status(400).json({ error: 'csvData is required' });
    }

    // Parse CSV
    const rows = parseCSV(csvData);
    if (rows.length === 0) {
      return res.status(400).json({ error: 'No valid rows found in CSV' });
    }

    // Fetch all patients for matching
    const { data: patients, error: pErr } = await supabase
      .from('patients')
      .select('id, name, first_name, last_name, phone')
      .order('name');

    if (pErr) throw pErr;

    // Build lookup map — lowercase name → patient
    const patientMap = new Map();
    for (const p of patients) {
      const fullName = (p.name || `${p.first_name || ''} ${p.last_name || ''}`.trim()).toLowerCase();
      if (fullName) patientMap.set(fullName, p);
      // Also index by first_name + last_name
      if (p.first_name && p.last_name) {
        patientMap.set(`${p.first_name} ${p.last_name}`.toLowerCase(), p);
      }
    }

    // Fetch existing appointments for duplicate detection
    const { data: existingAppts, error: aErr } = await supabase
      .from('appointments')
      .select('patient_name, service_name, start_time, source')
      .eq('source', 'ghl_import');

    if (aErr) throw aErr;

    // Build duplicate check set
    const existingSet = new Set();
    for (const a of (existingAppts || [])) {
      const key = `${(a.patient_name || '').toLowerCase()}|${(a.service_name || '').toLowerCase()}|${a.start_time}`;
      existingSet.add(key);
    }

    // Process rows
    const details = [];
    const toInsert = [];

    for (const row of rows) {
      const detail = {
        name: row.contactName,
        service: row.service,
        time: row.requestedTime,
        status: 'pending',
        reason: '',
      };

      // Skip empty names
      if (!row.contactName) {
        detail.status = 'skipped';
        detail.reason = 'No contact name';
        details.push(detail);
        continue;
      }

      // Parse date
      const startDate = parseGHLDate(row.requestedTime);
      if (!startDate) {
        detail.status = 'error';
        detail.reason = `Cannot parse date: ${row.requestedTime}`;
        details.push(detail);
        continue;
      }

      // Map service
      const serviceInfo = SERVICE_MAP[row.service];
      if (!serviceInfo) {
        detail.status = 'error';
        detail.reason = `Unknown service: ${row.service}`;
        details.push(detail);
        continue;
      }

      // Map status
      const apptStatus = STATUS_MAP[row.status] || 'scheduled';

      // Match patient
      const patient = patientMap.get(row.contactName.toLowerCase());

      // Calculate end time
      const endDate = new Date(startDate.getTime() + serviceInfo.duration * 60000);

      // Check duplicate
      const dupeKey = `${row.contactName.toLowerCase()}|${serviceInfo.name.toLowerCase()}|${startDate.toISOString()}`;
      if (existingSet.has(dupeKey)) {
        detail.status = 'duplicate';
        detail.reason = 'Already imported';
        details.push(detail);
        continue;
      }

      // Build appointment record
      const apptRecord = {
        patient_id: patient?.id || null,
        patient_name: row.contactName,
        patient_phone: patient?.phone || null,
        service_name: serviceInfo.name,
        service_category: serviceInfo.category,
        provider: row.appointmentOwner || null,
        location: 'Range Medical — Newport Beach',
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        duration_minutes: serviceInfo.duration,
        status: apptStatus,
        notes: row.rescheduled === 'Yes' ? 'Rescheduled from GHL' : null,
        source: 'ghl_import',
        created_by: 'ghl_csv_import',
      };

      // Add to dedup set so we don't insert same row twice from CSV
      existingSet.add(dupeKey);

      detail.status = patient ? 'matched' : 'unmatched';
      detail.reason = patient ? `Matched to ${patient.name || patient.first_name + ' ' + patient.last_name}` : 'No matching patient found';
      detail.mappedService = serviceInfo.name;
      detail.mappedStatus = apptStatus;
      details.push(detail);
      toInsert.push(apptRecord);
    }

    // Summary stats
    const summary = {
      total: rows.length,
      matched: details.filter(d => d.status === 'matched').length,
      unmatched: details.filter(d => d.status === 'unmatched').length,
      duplicates: details.filter(d => d.status === 'duplicate').length,
      errors: details.filter(d => d.status === 'error').length,
      skipped: details.filter(d => d.status === 'skipped').length,
      toImport: toInsert.length,
    };

    if (dryRun) {
      return res.status(200).json({ success: true, dryRun: true, summary, details });
    }

    // Insert in batches of 100
    let imported = 0;
    const batchSize = 100;
    for (let i = 0; i < toInsert.length; i += batchSize) {
      const batch = toInsert.slice(i, i + batchSize);
      const { error: insertErr } = await supabase
        .from('appointments')
        .insert(batch);

      if (insertErr) {
        return res.status(500).json({
          error: `Insert failed at batch ${Math.floor(i / batchSize) + 1}: ${insertErr.message}`,
          summary: { ...summary, imported },
          details,
        });
      }
      imported += batch.length;
    }

    summary.imported = imported;

    return res.status(200).json({ success: true, summary, details });
  } catch (err) {
    console.error('GHL appointment import error:', err);
    return res.status(500).json({ error: err.message });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};
