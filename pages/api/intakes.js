// pages/api/intakes.js
// Saves medical intake form data to Supabase database
// Updated: Added decision tree fields (minor, optimization, symptoms)

import { createClient } from '@supabase/supabase-js';
import { checkAndUpdateFormsComplete } from '../../lib/check-forms-complete';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const formData = req.body;
    console.log('=== INTAKES API CALLED ===');
    console.log('Received fields:', Object.keys(formData));

    // Helper to convert Yes/No strings to boolean
    const toBool = (val) => {
      if (val === 'Yes' || val === 'yes' || val === true) return true;
      if (val === 'No' || val === 'no' || val === false) return false;
      return false;
    };

    // Helper to sanitize year fields (varchar(4) in DB)
    const sanitizeYear = (val) => {
      if (!val) return null;
      const str = String(val).trim();
      // Extract 4-digit year if present
      const match = str.match(/\d{4}/);
      if (match) return match[0];
      // If it's 4 chars or less, keep it
      if (str.length <= 4) return str;
      return str.substring(0, 4);
    };

    // Helper to format date for database (YYYY-MM-DD) or return null
    const formatDate = (dateStr) => {
      if (!dateStr) return null;
      // If already in YYYY-MM-DD format
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
      // If in MM/DD/YYYY format
      if (dateStr.includes('/')) {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
          const [month, day, year] = parts;
          return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
      }
      return null;
    };

    // Sanitize text inputs (trim whitespace, clean email)
    const trimStr = (val) => val ? String(val).trim() : val;
    const cleanEmail = (val) => val ? String(val).trim().replace(/\.+$/, '') : val;

    // Extract medical history
    const mh = formData.medicalHistory || {};

    // Build record matching EXACT table columns
    const intakeRecord = {
      // Required fields
      first_name: trimStr(formData.firstName) || '',
      last_name: trimStr(formData.lastName) || '',

      // Contact info
      email: cleanEmail(formData.email) || null,
      phone: formData.phone || null,
      date_of_birth: formatDate(formData.dateOfBirth),
      gender: formData.gender || null,
      preferred_name: trimStr(formData.preferredName) || null,

      // Address
      street_address: formData.streetAddress || null,
      city: formData.city || null,
      state: formData.state || null,
      country: formData.country || null,
      postal_code: formData.postalCode || null,
      
      // ============================================
      // MINOR / GUARDIAN FIELDS (NEW)
      // ============================================
      is_minor: toBool(formData.isMinor),
      guardian_name: formData.guardianName || null,
      guardian_relationship: formData.guardianRelationship || null,
      
      // ============================================
      // DECISION TREE - INJURY (Door 1)
      // ============================================
      injured: toBool(formData.injured),
      currently_injured: toBool(formData.injured),
      injury_description: formData.injuryDescription || null,
      injury_location: formData.injuryLocation || null,
      injury_date: formatDate(formData.injuryDate),
      injury_when_occurred: formData.injuryDate || null,
      pain_severity: formData.painSeverity ? parseInt(formData.painSeverity) : null,
      functional_limitation: formData.functionalLimitation ? parseInt(formData.functionalLimitation) : null,
      injury_trajectory: formData.injuryTrajectory || null,
      
      // ============================================
      // DECISION TREE - OPTIMIZATION (Door 2) (NEW)
      // ============================================
      interested_in_optimization: toBool(formData.interestedInOptimization),
      symptoms: formData.symptoms || null,  // JSONB array of checked symptoms
      symptom_followups: formData.symptomFollowups || null,  // JSONB object with follow-up answers
      symptom_duration: formData.symptomDuration || null,
      
      // ============================================
      // ADDITIONAL NOTES (NEW)
      // ============================================
      additional_notes: formData.additionalNotes || null,
      
      // What brings you in (legacy - keeping for backwards compatibility)
      what_brings_you: formData.whatBringsYou || null,
      what_brings_you_in: formData.whatBringsYou || null,
      
      // Medical conditions - boolean columns
      high_blood_pressure: mh.hypertension?.response === 'Yes',
      high_blood_pressure_year: sanitizeYear(mh.hypertension?.year),
      
      high_cholesterol: mh.highCholesterol?.response === 'Yes',
      high_cholesterol_year: sanitizeYear(mh.highCholesterol?.year),
      
      heart_disease: mh.heartDisease?.response === 'Yes',
      heart_disease_year: sanitizeYear(mh.heartDisease?.year),
      heart_disease_type: mh.heartDisease?.type || null,
      
      diabetes: mh.diabetes?.response === 'Yes',
      diabetes_year: sanitizeYear(mh.diabetes?.year),
      diabetes_type: mh.diabetes?.type || null,
      
      thyroid_disorder: mh.thyroid?.response === 'Yes',
      thyroid_disorder_year: sanitizeYear(mh.thyroid?.year),
      thyroid_disorder_type: mh.thyroid?.type || null,
      
      depression_anxiety: mh.depression?.response === 'Yes',
      depression_anxiety_year: sanitizeYear(mh.depression?.year),
      
      kidney_disease: mh.kidney?.response === 'Yes',
      kidney_disease_year: sanitizeYear(mh.kidney?.year),
      kidney_disease_type: mh.kidney?.type || null,
      
      liver_disease: mh.liver?.response === 'Yes',
      liver_disease_year: sanitizeYear(mh.liver?.year),
      liver_disease_type: mh.liver?.type || null,
      
      autoimmune_disorder: mh.autoimmune?.response === 'Yes',
      autoimmune_disorder_year: sanitizeYear(mh.autoimmune?.year),
      autoimmune_disorder_type: mh.autoimmune?.type || null,
      
      cancer: mh.cancer?.response === 'Yes',
      cancer_year: sanitizeYear(mh.cancer?.year),
      cancer_type: mh.cancer?.type || null,
      
      // Store full medical history as JSONB
      medical_conditions: formData.medicalHistory || null,
      
      // Goals / Reason for visit
      goals: formData.goals || null,

      // HRT
      on_hrt: toBool(formData.onHRT),
      hrt_details: formData.hrtDetails || null,

      // Previous therapy history
      previous_therapy: toBool(formData.previousTherapy),
      previous_therapy_details: formData.previousTherapyDetails || null,

      // Current supplements
      supplements: formData.supplements && formData.supplements.length > 0 ? formData.supplements : null,
      
      // Medications
      on_medications: toBool(formData.onMedications),
      on_other_medications: toBool(formData.onMedications),
      current_medications: formData.currentMedications || null,
      medication_notes: formData.medicationNotes || null,
      
      // Allergies
      has_allergies: toBool(formData.hasAllergies),
      allergies: formData.allergies || null,
      allergy_reactions: formData.allergyReactions || null,
      
      // How heard about us (combine friend name into how_heard for display)
      how_heard: formData.howHeardAboutUs === 'Friend or Family Member' && formData.howHeardFriend
        ? `Friend/Family: ${formData.howHeardFriend}`
        : formData.howHeardAboutUs || null,
      how_heard_other: formData.howHeardOther || null,
      
      // Primary care physician
      has_pcp: toBool(formData.hasPCP),
      pcp_name: formData.pcpName || null,
      
      // Recent hospitalization
      recent_hospitalization: toBool(formData.recentHospitalization),
      hospitalization_reason: formData.hospitalizationReason || null,
      
      // Files - URLs from Supabase Storage
      photo_id_url: formData.photoIdUrl || null,
      signature_url: formData.signatureUrl || null,
      pdf_url: formData.pdfUrl || null,
      
      // Consent
      consent_given: toBool(formData.consent),
      
      // Timestamp
      submitted_at: new Date().toISOString(),

      // Bundle token — links intake directly to form bundle for completion tracking
      bundle_token: formData.bundleToken || null,
    };

    console.log('Photo ID URL:', intakeRecord.photo_id_url);
    console.log('Signature URL:', intakeRecord.signature_url);
    console.log('Is Minor:', intakeRecord.is_minor);
    console.log('Interested in Optimization:', intakeRecord.interested_in_optimization);
    console.log('Symptoms:', intakeRecord.symptoms);

    // Insert into intakes table
    const { data, error } = await supabase
      .from('intakes')
      .insert(intakeRecord)
      .select()
      .single();

    if (error) {
      console.error('❌ Database error:', error.message);
      console.error('Error details:', error);
      return res.status(500).json({ 
        error: 'Failed to save intake form',
        details: error.message 
      });
    }

    console.log('✅ Intake saved! ID:', data.id);
    console.log('✅ Photo ID saved:', data.photo_id_url ? 'YES' : 'NO');
    console.log('✅ Signature saved:', data.signature_url ? 'YES' : 'NO');

    // ===== Link intake to patient =====
    // Priority: 1) bundle token  2) email match  3) phone match  4) create new
    let linkedPatientId = null;
    try {

      const cap = str => str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : '';
      const capFirst = cap(intakeRecord.first_name);
      const capLast  = cap(intakeRecord.last_name);

      // Build demographics update object from intake data
      const buildDemoUpdates = (existing) => {
        const u = {};
        if (!existing.date_of_birth && intakeRecord.date_of_birth) u.date_of_birth = intakeRecord.date_of_birth;
        if (!existing.gender && intakeRecord.gender) u.gender = intakeRecord.gender;
        if (!existing.address && intakeRecord.street_address) u.address = intakeRecord.street_address;
        if (!existing.city && intakeRecord.city) u.city = intakeRecord.city;
        if (!existing.state && intakeRecord.state) u.state = intakeRecord.state;
        if (!existing.zip_code && intakeRecord.postal_code) u.zip_code = intakeRecord.postal_code;
        if (capFirst || capLast) {
          u.first_name = capFirst || existing.first_name || '';
          u.last_name  = capLast  || existing.last_name  || '';
          u.name = `${u.first_name} ${u.last_name}`.trim();
        }
        if (intakeRecord.preferred_name) u.preferred_name = intakeRecord.preferred_name;
        if (intakeRecord.how_heard) u.referral_source = intakeRecord.how_heard;
        return u;
      };

      // --- Tier 1: Bundle token → patient_id or patient_phone ---
      const bundleToken = formData.bundleToken;
      if (bundleToken) {
        const { data: bundle } = await supabase
          .from('form_bundles')
          .select('patient_id, patient_phone, ghl_contact_id')
          .eq('token', bundleToken)
          .maybeSingle();

        if (bundle?.patient_id) {
          const { data: bp } = await supabase
            .from('patients')
            .select('id, first_name, last_name, date_of_birth, gender, address, city, state, zip_code, preferred_name, referral_source')
            .eq('id', bundle.patient_id)
            .maybeSingle();
          if (bp) {
            const u = buildDemoUpdates(bp);
            if (Object.keys(u).length > 0) await supabase.from('patients').update(u).eq('id', bp.id);
            linkedPatientId = bp.id;
            console.log(`Intake linked via bundle patient_id: ${linkedPatientId}`);
          }
        }

        if (!linkedPatientId && bundle?.patient_phone) {
          const last10 = bundle.patient_phone.replace(/\D/g, '').slice(-10);
          const { data: pp } = await supabase
            .from('patients')
            .select('id, first_name, last_name, date_of_birth, gender, address, city, state, zip_code, preferred_name, referral_source')
            .ilike('phone', `%${last10}`)
            .maybeSingle();
          if (pp) {
            const u = buildDemoUpdates(pp);
            if (Object.keys(u).length > 0) await supabase.from('patients').update(u).eq('id', pp.id);
            linkedPatientId = pp.id;
            console.log(`Intake linked via bundle phone: ${linkedPatientId}`);
          }
        }
      }

      // --- Tier 2: Email match ---
      if (!linkedPatientId && intakeRecord.email) {
        const normalizedEmail = intakeRecord.email.toLowerCase().trim();
        const { data: ep } = await supabase
          .from('patients')
          .select('id, first_name, last_name, date_of_birth, gender, address, city, state, zip_code, preferred_name, referral_source')
          .eq('email', normalizedEmail)
          .maybeSingle();
        if (ep) {
          const u = buildDemoUpdates(ep);
          if (Object.keys(u).length > 0) await supabase.from('patients').update(u).eq('id', ep.id);
          linkedPatientId = ep.id;
          console.log(`Intake linked via email: ${linkedPatientId}`);
        }
      }

      // --- Tier 3: Phone match ---
      if (!linkedPatientId && intakeRecord.phone) {
        const last10 = intakeRecord.phone.replace(/\D/g, '').slice(-10);
        if (last10.length === 10) {
          const { data: pp } = await supabase
            .from('patients')
            .select('id, first_name, last_name, date_of_birth, gender, address, city, state, zip_code, preferred_name, referral_source')
            .ilike('phone', `%${last10}`)
            .maybeSingle();
          if (pp) {
            const u = buildDemoUpdates(pp);
            if (Object.keys(u).length > 0) await supabase.from('patients').update(u).eq('id', pp.id);
            linkedPatientId = pp.id;
            console.log(`Intake linked via phone: ${linkedPatientId}`);
          }
        }
      }

      // --- Tier 4: Create new patient (requires email) ---
      if (!linkedPatientId && intakeRecord.email) {
        const normalizedEmail = intakeRecord.email.toLowerCase().trim();
        const { data: np, error: createErr } = await supabase
          .from('patients')
          .insert({
            first_name: capFirst,
            last_name: capLast,
            name: `${capFirst} ${capLast}`.trim(),
            email: normalizedEmail,
            phone: intakeRecord.phone || null,
            date_of_birth: intakeRecord.date_of_birth || null,
            gender: intakeRecord.gender || null,
            preferred_name: intakeRecord.preferred_name || null,
            address: intakeRecord.street_address || null,
            city: intakeRecord.city || null,
            state: intakeRecord.state || null,
            zip_code: intakeRecord.postal_code || null,
            referral_source: intakeRecord.how_heard || null,
          })
          .select('id')
          .single();
        if (createErr) {
          console.error('Patient creation from intake error:', createErr);
        } else {
          linkedPatientId = np.id;
          console.log(`Intake: created new patient ${linkedPatientId} (${capFirst} ${capLast} / ${normalizedEmail})`);
        }
      }

      if (linkedPatientId) {
        await supabase.from('intakes').update({ patient_id: linkedPatientId }).eq('id', data.id);
        console.log(`✅ Intake ${data.id} linked to patient ${linkedPatientId}`);

        // Update bundle's patient_id if it was null — ensures completion tracking works
        if (bundleToken) {
          const { data: bundleRow } = await supabase
            .from('form_bundles')
            .select('patient_id')
            .eq('token', bundleToken)
            .maybeSingle();
          if (bundleRow && !bundleRow.patient_id) {
            await supabase.from('form_bundles').update({ patient_id: linkedPatientId }).eq('token', bundleToken);
            console.log(`✅ Bundle ${bundleToken} updated with patient_id ${linkedPatientId}`);
          }
        }
      } else {
        console.warn(`⚠️ Intake ${data.id} could not be linked to any patient`);
      }

    } catch (demoErr) {
      console.error('Patient linking error:', demoErr);
    }

    // T-03: Check if this completes all required forms for any upcoming appointment
    if (linkedPatientId) {
      checkAndUpdateFormsComplete(linkedPatientId).catch(err =>
        console.error('forms_complete check error:', err)
      );
    }

    // ===== Trigger baseline questionnaire SMS =====
    // Fire-and-forget — don't block the intake response
    if (intakeRecord.injured || intakeRecord.interested_in_optimization) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '');
        if (baseUrl) {
          fetch(`${baseUrl}/api/questionnaire/trigger`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ intake_id: data.id }),
          }).catch(err => console.error('Questionnaire trigger fire-and-forget error:', err));
          console.log(`🔔 Baseline questionnaire trigger fired for intake ${data.id}`);
        }
      } catch (triggerErr) {
        console.error('Questionnaire trigger setup error:', triggerErr);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Intake form saved successfully',
      id: data.id
    });

  } catch (error) {
    console.error('❌ Server error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
