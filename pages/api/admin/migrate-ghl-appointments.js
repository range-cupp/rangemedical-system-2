// /pages/api/admin/migrate-ghl-appointments.js
// One-time migration: Pull future GHL appointments into the appointments table
// Uses /contacts/{contactId}/appointments endpoint (confirmed working)
// Does NOT trigger any patient notifications (direct DB insert, no webhook)
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const GHL_API_KEY = process.env.GHL_API_KEY;
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID;

// Map GHL calendar names/titles to service categories
const TITLE_TO_CATEGORY = {
  'hyperbaric oxygen therapy': 'hbot',
  'hbot': 'hbot',
  'red light therapy': 'rlt',
  'rlt': 'rlt',
  'range iv': 'iv',
  'nad+ iv': 'iv',
  'vitamin c iv': 'iv',
  'high dose vitamin c iv': 'iv',
  'glutathione iv': 'iv',
  'mb + vit c + mag combo': 'iv',
  'specialty iv': 'iv',
  'exosome iv': 'iv',
  'byo iv': 'iv',
  'byo - iv': 'iv',
  'iv therapy': 'iv',
  'range injections': 'injection',
  'nad+ injection': 'injection',
  'nad+ injection (100mg)': 'injection',
  'nad injection': 'injection',
  'b12 injection': 'injection',
  'glutathione injection': 'injection',
  'vitamin injection': 'injection',
  'injection - testosterone': 'hrt',
  'injection - weight loss': 'weight_loss',
  'injection - peptide': 'peptide',
  'injection - medical': 'injection',
  'initial consultation': 'other',
  'initial consultation - peptide': 'peptide',
  'initial consultation - telephone': 'other',
  'follow-up consultation': 'other',
  'blood draw': 'labs',
  'new patient blood draw': 'labs',
  'follow up blood draw': 'labs',
  'initial lab review': 'labs',
  'initial lab review - tele-medicine': 'labs',
  'follow up lab review': 'labs',
  'follow up lab review - tele-medicine': 'labs',
  'follow up lab review - telephone call': 'labs',
  'lab review': 'labs',
  'medication pickup': 'other',
  'the range assesment': 'other',
  'the range assesment - telemedicine': 'other',
};

function getServiceCategory(title) {
  if (!title) return 'other';
  const lower = title.toLowerCase();
  if (TITLE_TO_CATEGORY[lower]) return TITLE_TO_CATEGORY[lower];
  for (const [key, value] of Object.entries(TITLE_TO_CATEGORY)) {
    if (lower.includes(key) || key.includes(lower)) return value;
  }
  return 'other';
}

// Properly determine if a date falls in Pacific Daylight Time
// US DST: starts 2nd Sunday of March at 2am, ends 1st Sunday of November at 2am
function isPacificDST(year, month, day) {
  if (month < 3 || month > 11) return false; // Jan, Feb, Dec → PST
  if (month > 3 && month < 11) return true;  // Apr–Oct → PDT

  if (month === 3) {
    // Find 2nd Sunday of March
    const firstDayOfWeek = new Date(year, 2, 1).getDay(); // 0=Sun
    const firstSunday = firstDayOfWeek === 0 ? 1 : (8 - firstDayOfWeek);
    const secondSunday = firstSunday + 7;
    return day >= secondSunday;
  }

  if (month === 11) {
    // Find 1st Sunday of November
    const firstDayOfWeek = new Date(year, 10, 1).getDay();
    const firstSunday = firstDayOfWeek === 0 ? 1 : (8 - firstDayOfWeek);
    return day < firstSunday;
  }

  return false;
}

function addPacificTimezone(timeStr) {
  if (!timeStr) return timeStr;
  let isoTime = timeStr.includes('T') ? timeStr : timeStr.replace(' ', 'T');
  if (!isoTime.match(/[Z]$/) && !isoTime.match(/[+-]\d{2}:\d{2}$/)) {
    const year = parseInt(isoTime.substring(0, 4));
    const month = parseInt(isoTime.substring(5, 7));
    const day = parseInt(isoTime.substring(8, 10));
    const offset = isPacificDST(year, month, day) ? '-07:00' : '-08:00';
    isoTime += offset;
  }
  return isoTime;
}

// Known calendar ID -> name map from clinic_appointments
const CALENDAR_NAMES = {
  '68fbb36bde21d1840e5f412e': 'Hyperbaric Oxygen Therapy',
  '68fbb3888eb4bc0d9dc758cb': 'Red Light Therapy',
  '68efcd8ae4e0ed94b9390a06': 'IV Therapy',
  '68f01d9a238b376bfa9a758c': 'Range Injections',
  '68fbc3300d41ec836e706680': 'Follow Up Blood Draw',
  '68fbc3cc4cbe5615edb2016d': 'Initial Lab Review',
  '68fc0789f5c19143d3386396': 'Injection - Weight Loss',
  '68fbe09a4866ec6b798932b6': 'Injection - Testosterone',
  '6946d1509a25681dba593fcd': 'Injection - Medical',
  '68f01aea7ed18b27a8b12e64': 'New Patient Blood Draw',
  '6900eedaf5009e264f9ded8e': 'Injection - Peptide',
  '690bfaf5fd20ba6d2a8b38c4': 'Medication Pickup',
  '6927b9d04a229b065d560def': 'Initial Consultation - Telephone',
  '690d522562da4d05eed3e98d': 'Initial Consultation - Peptide',
  '68fbc36b4cbe564781b1f35c': 'Follow Up Lab Review',
  '68efa7f2a4000567ffb24e89': 'Initial Consultation',
  '68efc2e5c36a832e51cada96': 'Follow-Up Consultation',
  '690cae20ae8412d0d3abca10': 'BYO - IV',
  '690776fc8dd2f5886acf9f8a': 'NAD+ Injection (100mg)',
  '690d0d03ec7b0073354f70fc': 'High Dose Vitamin C IV',
  '6914afb9ec4f06d1b2609269': 'Follow Up Lab Review - Tele-Medicine',
  '6914afc35cdddbe5fef3bb85': 'Follow Up Lab Review - Telephone Call',
  '6914adef7cacf62860839498': 'Initial Lab Review - Tele-Medicine',
  '69769eed725303dcad0eb2da': 'The Range Assesment',
  '697f8c0b31ec33d28fdc9c49': 'The Range Assesment - Telemedicine',
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const results = {
    found: 0,
    migrated: 0,
    skipped: 0,
    errors: [],
    debug: {},
  };

  try {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const { days } = req.body || {};
    const futureDays = days || 90;
    const futureDate = new Date(now);
    futureDate.setDate(futureDate.getDate() + futureDays);
    const futureDateStr = futureDate.toISOString().split('T')[0];

    console.log('=== MIGRATE GHL APPOINTMENTS ===');
    console.log(`Looking for appointments: ${todayStr} to ${futureDateStr}`);

    // Clean up: delete previously migrated GHL appointments so we can re-insert with correct times
    const { data: deleted, error: deleteError } = await supabase
      .from('appointments')
      .delete()
      .eq('source', 'ghl')
      .gte('start_time', todayStr)
      .select('id');

    results.debug.cleaned = deleted?.length || 0;
    if (deleteError) results.debug.cleanError = deleteError.message;
    console.log(`Cleaned ${results.debug.cleaned} existing GHL appointments`);

    // Get ALL patients with GHL contact IDs (no limit)
    const { data: patients } = await supabase
      .from('patients')
      .select('id, name, ghl_contact_id, phone')
      .not('ghl_contact_id', 'is', null);

    if (!patients || patients.length === 0) {
      return res.status(200).json({ success: true, message: 'No linked patients found', ...results });
    }

    results.debug.totalPatients = patients.length;
    console.log(`Checking ${patients.length} patients for future appointments`);

    const headers = {
      'Authorization': `Bearer ${GHL_API_KEY}`,
      'Version': '2021-07-28',
    };

    // Process in small batches to avoid GHL rate limiting (526/1000 got 429'd at batch=10)
    const batchSize = 5;
    let apiErrors = 0;

    for (let i = 0; i < patients.length; i += batchSize) {
      const batch = patients.slice(i, i + batchSize);

      const batchResults = await Promise.all(
        batch.map(async (patient) => {
          try {
            const url = `https://services.leadconnectorhq.com/contacts/${patient.ghl_contact_id}/appointments`;
            const response = await fetch(url, { headers });

            if (!response.ok) {
              if (response.status === 429) apiErrors++;
              return [];
            }

            const data = await response.json();
            const appointments = data.events || data.appointments || [];

            // Filter to future, non-cancelled appointments
            return appointments
              .filter(apt => {
                const startTime = apt.startTime || apt.start_time || '';
                const aptDate = startTime.split(/[T ]/)[0];
                const status = (apt.status || apt.appointmentStatus || '').toLowerCase();
                return aptDate >= todayStr && aptDate <= futureDateStr &&
                  status !== 'cancelled' && status !== 'canceled' &&
                  status !== 'no_show' && status !== 'noshow';
              })
              .map(apt => ({ ...apt, _patient: patient }));
          } catch {
            return [];
          }
        })
      );

      // Process results
      for (const appointments of batchResults) {
        for (const apt of appointments) {
          results.found++;
          const patient = apt._patient;
          const appointmentId = apt.id || apt.appointmentId;
          const calendarId = apt.calendarId || apt.calendar_id || '';

          // Get service name from calendar name map or title
          const calendarName = CALENDAR_NAMES[calendarId] || '';
          const titleParts = (apt.title || '').split(' - ');
          const serviceName = calendarName ||
            (titleParts.length > 1 ? titleParts.slice(1).join(' - ').trim() : apt.title || 'Appointment');
          const serviceCategory = getServiceCategory(serviceName);

          let startTimeVal = addPacificTimezone(apt.startTime || apt.start_time || '');
          let endTimeVal = addPacificTimezone(apt.endTime || apt.end_time || '');

          let durationMinutes = 30;
          if (startTimeVal && endTimeVal) {
            const diff = new Date(endTimeVal) - new Date(startTimeVal);
            if (diff > 0) durationMinutes = Math.round(diff / 60000);
          }

          try {
            // Check if this GHL appointment already exists
            const { data: existing } = await supabase
              .from('appointments')
              .select('id')
              .eq('ghl_appointment_id', appointmentId)
              .limit(1);

            if (existing && existing.length > 0) {
              results.skipped++;
              continue;
            }

            // Insert new appointment
            const { error: insertError } = await supabase
              .from('appointments')
              .insert({
                patient_id: patient.id,
                patient_name: patient.name || 'Unknown',
                patient_phone: patient.phone || null,
                service_name: serviceName,
                service_category: serviceCategory,
                start_time: startTimeVal,
                end_time: endTimeVal,
                duration_minutes: durationMinutes,
                status: 'scheduled',
                source: 'ghl',
                ghl_appointment_id: appointmentId,
              });

            if (insertError) {
              results.errors.push({ patient: patient.name, appointmentId, error: insertError.message });
            } else {
              results.migrated++;
            }
          } catch (e) {
            results.errors.push({ patient: patient.name, appointmentId, error: e.message });
          }
        }
      }

      // Delay between batches to avoid GHL rate limiting
      if (i + batchSize < patients.length) {
        await new Promise(r => setTimeout(r, 500));
      }
    }

    results.debug.apiErrors = apiErrors;
    console.log(`Migration complete: ${results.found} found, ${results.migrated} migrated, ${results.errors.length} errors`);

    return res.status(200).json({
      success: true,
      message: `Migrated ${results.migrated} future GHL appointments (no notifications sent)`,
      ...results,
    });

  } catch (error) {
    console.error('Migration error:', error);
    return res.status(500).json({ error: error.message, ...results });
  }
}
