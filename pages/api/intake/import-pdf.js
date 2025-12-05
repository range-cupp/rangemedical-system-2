// pages/api/intake/import-pdf.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Helper function to extract year from text like "Yes [2020]"
function extractYear(text, conditionName) {
  const regex = new RegExp(conditionName + '.*?:\\s*Yes\\s*\\[(\\d{4})\\]', 'i');
  const match = text.match(regex);
  return match ? match[1] : null;
}

// Parse text extracted from PDF
function parseIntakeText(text) {
  const data = {
    personal: {},
    address: {},
    health: {},
    medical_history: {},
    medications: {}
  };

  try {
    // Extract personal info
    const nameMatch = text.match(/Name:\s*([^\n]+)/);
    if (nameMatch) data.personal.name = nameMatch[1].trim();

    const dobMatch = text.match(/Date of Birth:\s*(\d{4}-\d{2}-\d{2})/);
    if (dobMatch) data.personal.date_of_birth = dobMatch[1];

    const emailMatch = text.match(/Email:\s*([^\n]+)/);
    if (emailMatch) data.personal.email = emailMatch[1].trim().toLowerCase();

    const phoneMatch = text.match(/Phone:\s*([^\n]+)/);
    if (phoneMatch) data.personal.phone = phoneMatch[1].trim();

    // Extract address
    const addressLines = text.split('\n');
    const addressIndex = addressLines.findIndex(line => line.includes('ADDRESS'));
    if (addressIndex >= 0 && addressIndex + 3 < addressLines.length) {
      data.address.address = addressLines[addressIndex + 1].trim();
      const cityLine = addressLines[addressIndex + 2].trim();
      const cityParts = cityLine.split(',');
      if (cityParts.length >= 2) {
        data.address.city = cityParts[0].trim();
        const stateZip = cityParts[1].trim().split(/\s+/);
        data.address.state = stateZip[0];
        data.address.zip_code = stateZip[1];
      }
    }

    // Extract health info
    const concernsMatch = text.match(/What Brings You In:\s*(.+?)(?=\s*Currently Injured:)/s);
    if (concernsMatch) {
      data.health.what_brings_you_in = concernsMatch[1].trim().replace(/\s+/g, ' ');
    }

    data.health.currently_injured = text.includes('Currently Injured: Yes');
    
    const injuryDescMatch = text.match(/Injury Description:\s*([^\n]+)/);
    if (injuryDescMatch) data.health.injury_description = injuryDescMatch[1].trim();

    const injuryLocMatch = text.match(/Injury Location:\s*([^\n]+)/);
    if (injuryLocMatch) data.health.injury_location = injuryLocMatch[1].trim();

    const injuryDateMatch = text.match(/When It Occurred:\s*([^\n]+)/);
    if (injuryDateMatch) data.health.injury_when_occurred = injuryDateMatch[1].trim();

    // Medical history - WITH YEARS
    data.medical_history = {
      high_blood_pressure: text.includes('High Blood Pressure') && text.includes(': Yes'),
      high_blood_pressure_year: extractYear(text, 'High Blood Pressure'),
      
      high_cholesterol: text.includes('High Cholesterol: Yes'),
      high_cholesterol_year: extractYear(text, 'High Cholesterol'),
      
      heart_disease: text.includes('Heart Disease: Yes'),
      heart_disease_year: extractYear(text, 'Heart Disease'),
      
      diabetes: text.includes('Diabetes: Yes'),
      diabetes_year: extractYear(text, 'Diabetes'),
      
      thyroid_disorder: text.includes('Thyroid Disorder: Yes'),
      thyroid_disorder_year: extractYear(text, 'Thyroid Disorder'),
      
      depression_anxiety: text.includes('Depression / Anxiety: Yes'),
      depression_anxiety_year: extractYear(text, 'Depression / Anxiety'),
      
      kidney_disease: text.includes('Kidney Disease: Yes'),
      kidney_disease_year: extractYear(text, 'Kidney Disease'),
      
      liver_disease: text.includes('Liver Disease: Yes'),
      liver_disease_year: extractYear(text, 'Liver Disease'),
      
      autoimmune_disorder: text.includes('Autoimmune Disorder: Yes'),
      autoimmune_disorder_year: extractYear(text, 'Autoimmune Disorder'),
      
      cancer: text.includes('Cancer: Yes'),
      cancer_year: extractYear(text, 'Cancer')
    };

    // Medications & Allergies
    data.medications.on_hrt = text.includes('On HRT: Yes');
    data.medications.on_other_medications = text.includes('On Other Medications: Yes');
    
    const hasAllergiesMatch = text.match(/Has\s+Allergies:\s*Yes/i);
    data.medications.has_allergies = !!hasAllergiesMatch;
    
    if (data.medications.has_allergies) {
      const allergiesMatch = text.match(/(?:^|\n)\s*Allergies:\s*([^\n]+)/m);
      if (allergiesMatch) {
        const allergyText = allergiesMatch[1].trim();
        if (allergyText && allergyText.toLowerCase() !== 'yes' && !allergyText.includes('PHOTO')) {
          data.medications.allergies = allergyText;
        }
      }
    } else {
      data.medications.allergies = null;
    }

    // Consent
    data.consent_given = text.includes('Consent Given: Yes');

    // Submission date
    const submittedMatch = text.match(/Submitted:\s*(\d{1,2})\/(\d{1,2})\/(\d{4}),\s*(\d{1,2}:\d{2}:\d{2})/);
    if (submittedMatch) {
      const [_, month, day, year, time] = submittedMatch;
      const paddedMonth = month.padStart(2, '0');
      const paddedDay = day.padStart(2, '0');
      data.submitted_at = `${year}-${paddedMonth}-${paddedDay}T${time}`;
    }

  } catch (error) {
    console.error('Parse error:', error);
  }

  return data;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { pdfText, filename } = req.body;

    if (!pdfText) {
      return res.status(400).json({ error: 'PDF text required' });
    }

    const extracted = parseIntakeText(pdfText);

    if (!extracted.personal.email) {
      return res.status(400).json({ error: 'Could not extract email from PDF' });
    }

    if (!extracted.personal.name) {
      return res.status(400).json({ error: 'Could not extract name from PDF' });
    }

    const { data: existingPatient, error: findError } = await supabase
      .from('patients')
      .select('id, name, email')
      .eq('email', extracted.personal.email)
      .maybeSingle();

    let patientId;
    let isNewPatient = false;

    if (existingPatient) {
      const { error: updateError } = await supabase
        .from('patients')
        .update({
          name: extracted.personal.name || existingPatient.name,
          phone: extracted.personal.phone || null,
          date_of_birth: extracted.personal.date_of_birth || null,
          address: extracted.address.address || null,
          city: extracted.address.city || null,
          state: extracted.address.state || null,
          zip_code: extracted.address.zip_code || null
        })
        .eq('id', existingPatient.id);

      if (updateError) {
        console.error('Update error:', updateError);
        throw new Error('Failed to update patient: ' + updateError.message);
      }

      patientId = existingPatient.id;
    } else {
      const { data: newPatient, error: createError } = await supabase
        .from('patients')
        .insert([{
          name: extracted.personal.name,
          email: extracted.personal.email,
          phone: extracted.personal.phone || null,
          date_of_birth: extracted.personal.date_of_birth || null,
          address: extracted.address.address || null,
          city: extracted.address.city || null,
          state: extracted.address.state || null,
          zip_code: extracted.address.zip_code || null
        }])
        .select()
        .single();

      if (createError) {
        console.error('Create error:', createError);
        throw new Error('Failed to create patient: ' + createError.message);
      }

      if (!newPatient || !newPatient.id) {
        throw new Error('Patient created but no ID returned');
      }

      patientId = newPatient.id;
      isNewPatient = true;
    }

    const nameParts = (extracted.personal.name || '').split(' ');
    const intakeData = {
      patient_id: patientId,
      first_name: nameParts[0] || '',
      last_name: nameParts.slice(1).join(' ') || '',
      email: extracted.personal.email,
      phone: extracted.personal.phone || '',
      date_of_birth: extracted.personal.date_of_birth || null,
      
      what_brings_you_in: extracted.health.what_brings_you_in || '',
      currently_injured: extracted.health.currently_injured || false,
      injury_description: extracted.health.injury_description || null,
      injury_location: extracted.health.injury_location || null,
      injury_when_occurred: extracted.health.injury_when_occurred || null,
      
      high_blood_pressure: extracted.medical_history.high_blood_pressure || false,
      high_blood_pressure_year: extracted.medical_history.high_blood_pressure_year || null,
      high_cholesterol: extracted.medical_history.high_cholesterol || false,
      high_cholesterol_year: extracted.medical_history.high_cholesterol_year || null,
      heart_disease: extracted.medical_history.heart_disease || false,
      heart_disease_year: extracted.medical_history.heart_disease_year || null,
      diabetes: extracted.medical_history.diabetes || false,
      diabetes_year: extracted.medical_history.diabetes_year || null,
      thyroid_disorder: extracted.medical_history.thyroid_disorder || false,
      thyroid_disorder_year: extracted.medical_history.thyroid_disorder_year || null,
      depression_anxiety: extracted.medical_history.depression_anxiety || false,
      depression_anxiety_year: extracted.medical_history.depression_anxiety_year || null,
      kidney_disease: extracted.medical_history.kidney_disease || false,
      kidney_disease_year: extracted.medical_history.kidney_disease_year || null,
      liver_disease: extracted.medical_history.liver_disease || false,
      liver_disease_year: extracted.medical_history.liver_disease_year || null,
      autoimmune_disorder: extracted.medical_history.autoimmune_disorder || false,
      autoimmune_disorder_year: extracted.medical_history.autoimmune_disorder_year || null,
      cancer: extracted.medical_history.cancer || false,
      cancer_year: extracted.medical_history.cancer_year || null,
      
      on_hrt: extracted.medications.on_hrt || false,
      on_other_medications: extracted.medications.on_other_medications || false,
      has_allergies: extracted.medications.has_allergies || false,
      allergies: extracted.medications.allergies || null,
      
      consent_given: extracted.consent_given || false,
      submitted_at: extracted.submitted_at || new Date().toISOString()
    };

    const { data: intake, error: intakeError } = await supabase
      .from('intakes')
      .insert([intakeData])
      .select()
      .single();

    if (intakeError) {
      console.error('Intake error:', intakeError);
      throw new Error('Failed to create intake: ' + intakeError.message);
    }

    return res.status(200).json({
      success: true,
      message: isNewPatient ? 'New patient and intake created' : 'Patient updated and intake created',
      patient_id: patientId,
      intake_id: intake.id,
      patient_name: extracted.personal.name,
      patient_email: extracted.personal.email,
      extracted_data: extracted
    });

  } catch (error) {
    console.error('Import error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Unknown error occurred'
    });
  }
}
