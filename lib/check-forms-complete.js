// lib/check-forms-complete.js
// After a form submission, check if the patient's upcoming appointments
// now have all required forms complete, and update forms_complete flag
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { REQUIRED_FORMS } from './appointment-services';
import { CONSENT_TYPE_TO_FORM_ID } from './form-bundles';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Check and update forms_complete for a patient's upcoming appointments
 * Call this after any consent or intake form submission
 *
 * @param {string|null} patientId - Patient UUID
 */
export async function checkAndUpdateFormsComplete(patientId) {
  if (!patientId) return;

  try {
    // Get upcoming scheduled appointments for this patient where forms_complete is false
    const { data: appointments } = await supabase
      .from('appointments')
      .select('id, service_category, cal_com_booking_id')
      .eq('patient_id', patientId)
      .eq('status', 'scheduled')
      .eq('forms_complete', false)
      .gte('start_time', new Date().toISOString());

    if (!appointments || appointments.length === 0) return;

    // Get all completed consents for this patient
    const { data: consents } = await supabase
      .from('consents')
      .select('consent_type')
      .eq('patient_id', patientId);

    const completedFormIds = new Set(
      (consents || []).map(c => CONSENT_TYPE_TO_FORM_ID[c.consent_type] || c.consent_type).filter(Boolean)
    );

    // Check intakes
    const { data: intakes } = await supabase
      .from('intakes')
      .select('id')
      .eq('patient_id', patientId)
      .limit(1);

    if (intakes && intakes.length > 0) {
      completedFormIds.add('intake');
    }

    // Check each appointment
    for (const appt of appointments) {
      const required = REQUIRED_FORMS[appt.service_category];
      if (!required) continue;

      const allComplete = required.every(formId => completedFormIds.has(formId));
      if (allComplete) {
        await supabase.from('appointments')
          .update({ forms_complete: true })
          .eq('id', appt.id);
        console.log(`✓ forms_complete set to true for appointment ${appt.id}`);
      }
    }
  } catch (err) {
    console.error('checkAndUpdateFormsComplete error:', err);
  }
}
