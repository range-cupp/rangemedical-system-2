// /pages/api/import/accessmedlabs.js
// Import AccessMedLabs CSV - with duplicate protection and detailed errors

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Map test names to database columns
const testMapping = {
  'testosterone': 'total_testosterone',
  'testosterone, total': 'total_testosterone',
  'testost., free, calc': 'free_testosterone',
  'testosterone, free': 'free_testosterone',
  'sex horm binding glob, serum': 'shbg',
  'sex hormone bind globulin': 'shbg',
  'estradiol': 'estradiol',
  'estradiol (e2)': 'estradiol',
  'progesterone': 'progesterone',
  'dhea-sulfate': 'dhea_s',
  'dht': 'dht',
  'fsh': 'fsh',
  'lh': 'lh',
  'luteinizing hormone(lh)': 'lh',
  'igf-1': 'igf_1',
  'cortisol': 'cortisol',
  'cortisol, am': 'cortisol',
  'tsh': 'tsh',
  'triiodothyronine (t3), free': 'free_t3',
  't4,free(direct)': 'free_t4',
  'thyroid peroxidase (tpo) ab': 'tpo_antibody',
  'thyroglobulin antibody': 'thyroglobulin_antibody',
  'psa, total': 'psa_total',
  'prostate specific ag': 'psa_total',
  'psa, free': 'psa_free',
  '% free psa': 'psa_free',
  'insulin': 'fasting_insulin',
  'hemoglobin a1c': 'hemoglobin_a1c',
  'uric acid': 'uric_acid',
  'cholesterol, total': 'total_cholesterol',
  'ldl chol calc (nih)': 'ldl_cholesterol',
  'ldl cholesterol, calc..': 'ldl_cholesterol',
  'hdl cholesterol': 'hdl_cholesterol',
  'triglycerides': 'triglycerides',
  'vldl cholesterol cal': 'vldl_cholesterol',
  'apolipoprotein b': 'apolipoprotein_b',
  'apolipoprotein a1': 'apolipoprotein_a1',
  'lp(a)': 'lp_a',
  'c-reactive protein, cardiac': 'crp_hs',
  'esr': 'esr',
  'homocysteine': 'homocysteine',
  'vitamin d, 25-hydroxy': 'vitamin_d',
  'vitamin b12': 'vitamin_b12',
  'folate': 'folate',
  'magnesium': 'magnesium',
  'alt (sgpt)': 'alt',
  'alt': 'alt',
  'ast (sgot)': 'ast',
  'ast': 'ast',
  'alkaline phosphatase': 'alkaline_phosphatase',
  'bilirubin, total': 'total_bilirubin',
  'albumin': 'albumin',
  'protein, total': 'total_protein',
  'total protein': 'total_protein',
  'ggt': 'ggt',
  'creatinine': 'creatinine',
  'creatinine, serum': 'creatinine',
  'bun': 'bun',
  'egfr': 'egfr',
  'gfr, estimated': 'egfr',
  'bun/creatinine ratio': 'bun_creatinine_ratio',
  'bun/creat ratio': 'bun_creatinine_ratio',
  'sodium': 'sodium',
  'potassium': 'potassium',
  'chloride': 'chloride',
  'carbon dioxide, total': 'co2',
  'co2': 'co2',
  'calcium': 'calcium',
  'glucose': 'glucose',
  'iron': 'iron',
  'iron bind.cap.(tibc)': 'tibc',
  'iron saturation': 'iron_saturation',
  'ferritin': 'ferritin',
  'wbc': 'wbc',
  'white blood cell': 'wbc',
  'rbc': 'rbc',
  'red blood cell': 'rbc',
  'hemoglobin': 'hemoglobin',
  'hematocrit': 'hematocrit',
  'mcv': 'mcv',
  'mch': 'mch',
  'mchc': 'mchc',
  'rdw': 'rdw',
  'platelets': 'platelets',
  'platelet count': 'platelets',
  'neutrophils': 'neutrophils_percent',
  'lymphs': 'lymphocytes_percent',
  'monocytes': 'monocytes_percent',
  'eos': 'eosinophils_percent',
  'basos': 'basophils_percent',
  'neutrophils (absolute)': 'neutrophils_absolute',
  'lymphs (absolute)': 'lymphocytes_absolute',
  'monocytes(absolute)': 'monocytes_absolute',
  'eos (absolute)': 'eosinophils_absolute',
  'baso (absolute)': 'basophils_absolute'
};

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function parseDate(dateStr) {
  if (!dateStr) return null;
  const cleaned = dateStr.trim();
  const parts = cleaned.split('/');
  if (parts.length === 3) {
    let year = parseInt(parts[2]);
    if (year < 100) {
      year = year > 50 ? 1900 + year : 2000 + year;
    }
    return `${year}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
  }
  return null;
}

function parseNumeric(value) {
  if (!value) return null;
  const cleaned = value.toString().trim().replace(/[<>]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

async function findOrCreatePatient(firstName, lastName, email, phone) {
  const cleanEmail = email?.trim().toLowerCase();
  const cleanPhone = phone?.replace(/\D/g, '');
  const cleanFirst = firstName?.trim();
  const cleanLast = lastName?.trim();
  
  // Try to find by email first
  if (cleanEmail && cleanEmail.length > 0) {
    const { data: existing } = await supabase
      .from('patients')
      .select('id')
      .ilike('email', cleanEmail)
      .single();
    
    if (existing) return { id: existing.id, status: 'found_by_email' };
  }
  
  // Try to find by name
  if (cleanFirst && cleanLast) {
    const { data: existingByName } = await supabase
      .from('patients')
      .select('id')
      .ilike('first_name', cleanFirst)
      .ilike('last_name', cleanLast)
      .single();
    
    if (existingByName) return { id: existingByName.id, status: 'found_by_name' };
  }
  
  // Create new patient
  const { data: newPatient, error } = await supabase
    .from('patients')
    .insert({
      first_name: cleanFirst || null,
      last_name: cleanLast || null,
      email: cleanEmail || null,
      phone: cleanPhone || null
    })
    .select('id')
    .single();
  
  if (error) {
    return { id: null, status: 'error', error: error.message };
  }
  
  return { id: newPatient.id, status: 'created' };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST required' });
  }

  const { csvData, previewOnly } = req.body;
  
  if (!csvData) {
    return res.status(400).json({ error: 'csvData required in body' });
  }

  const lines = csvData.split('\n');
  const results = { 
    imported: 0, 
    errors: 0, 
    skipped: 0, 
    duplicates: 0,
    details: [],
    errorDetails: []
  };
  const seenOrders = new Set();

  // First pass - get all existing order numbers to detect duplicates
  const { data: existingLabs } = await supabase
    .from('labs')
    .select('notes')
    .like('notes', 'Order #%');
  
  const existingOrderNumbers = new Set();
  (existingLabs || []).forEach(lab => {
    const match = lab.notes?.match(/Order #(\d+)/);
    if (match) existingOrderNumbers.add(match[1].trim());
  });

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    const fields = parseCSVLine(line);

    const orderNumber = fields[0]?.trim();
    const lastName = fields[1]?.trim();
    const firstName = fields[2]?.trim();
    const email = fields[5]?.trim();
    const phone = fields[9]?.trim();
    const collectionDate = fields[17]?.trim();

    // Skip duplicate orders in same file
    if (seenOrders.has(orderNumber)) continue;
    seenOrders.add(orderNumber);

    if (!firstName || !lastName) {
      results.skipped++;
      results.details.push({ 
        name: 'Unknown', 
        status: 'skipped',
        reason: 'Missing name'
      });
      continue;
    }

    const fullName = `${firstName} ${lastName}`;

    // Check if this order was already imported (DUPLICATE PROTECTION)
    if (existingOrderNumbers.has(orderNumber)) {
      results.duplicates++;
      results.details.push({ 
        name: fullName, 
        status: 'duplicate',
        reason: `Order #${orderNumber} already imported`
      });
      continue;
    }

    const testDate = parseDate(collectionDate);
    if (!testDate) {
      results.skipped++;
      results.details.push({ 
        name: fullName, 
        status: 'skipped',
        reason: `Invalid date: ${collectionDate}`
      });
      continue;
    }

    // If preview only, don't actually import
    if (previewOnly) {
      results.details.push({ 
        name: fullName, 
        date: testDate,
        status: 'will_import'
      });
      results.imported++;
      continue;
    }

    // Find or create patient
    const patientResult = await findOrCreatePatient(firstName, lastName, email, phone);
    
    if (!patientResult.id) {
      results.errors++;
      results.errorDetails.push({ 
        name: fullName, 
        email: email || '(no email)',
        error: patientResult.error || 'Failed to create patient'
      });
      results.details.push({ 
        name: fullName, 
        status: 'error',
        reason: patientResult.error || 'Failed to create patient'
      });
      continue;
    }

    // Double check for existing lab (same patient + same date)
    const { data: existingLab } = await supabase
      .from('labs')
      .select('id')
      .eq('patient_id', patientResult.id)
      .eq('test_date', testDate)
      .single();

    if (existingLab) {
      results.duplicates++;
      results.details.push({ 
        name: fullName, 
        status: 'duplicate',
        reason: `Lab already exists for ${testDate}`
      });
      continue;
    }

    const labData = {
      patient_id: patientResult.id,
      test_date: testDate,
      panel_type: 'Elite',
      lab_provider: 'AccessMedLabs',
      notes: `Order #${orderNumber}`
    };

    // Parse test results
    for (let j = 24; j < fields.length - 1; j += 2) {
      const testName = fields[j]?.trim().toLowerCase();
      const testValue = fields[j + 1];
      if (!testName || !testValue) continue;
      
      const column = testMapping[testName];
      if (column) {
        const numValue = parseNumeric(testValue);
        if (numValue !== null) {
          labData[column] = numValue;
        }
      }
    }

    const { error: labError } = await supabase.from('labs').insert(labData);

    if (labError) {
      results.errors++;
      results.errorDetails.push({ 
        name: fullName, 
        email: email || '(no email)',
        error: labError.message 
      });
      results.details.push({ 
        name: fullName, 
        status: 'error',
        reason: labError.message
      });
    } else {
      results.imported++;
      results.details.push({ 
        name: fullName, 
        date: testDate, 
        status: 'imported',
        patientStatus: patientResult.status
      });
    }
  }

  return res.status(200).json(results);
}
