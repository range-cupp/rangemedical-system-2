// /pages/api/admin/migrate-ghl-appointments.js
// One-time migration: Pull future GHL appointments into the appointments table
// Does NOT trigger any patient notifications (direct DB insert, no webhook)
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const GHL_API_KEY = process.env.GHL_API_KEY;
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID;

// Map GHL appointment titles to service categories
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
  'methylene blue iv': 'iv',
  'specialty iv': 'iv',
  'hydration iv': 'iv',
  'exosome iv': 'iv',
  'byo iv': 'iv',
  'range injections': 'injection',
  'nad+ injection': 'injection',
  'nad injection': 'injection',
  'b12 injection': 'injection',
  'glutathione injection': 'injection',
  'vitamin injection': 'injection',
  'injection - testosterone': 'hrt',
  'injection - weight loss': 'weight_loss',
  'injection - peptide': 'peptide',
  'initial consultation': 'other',
  'follow-up consultation': 'other',
  'blood draw': 'labs',
  'new patient blood draw': 'labs',
  'follow up blood draw': 'labs',
  'lab review': 'labs',
};

function getServiceCategory(title) {
  if (!title) return 'other';
  const lower = title.toLowerCase();

  // Try exact match first
  if (TITLE_TO_CATEGORY[lower]) return TITLE_TO_CATEGORY[lower];

  // Try partial match
  for (const [key, value] of Object.entries(TITLE_TO_CATEGORY)) {
    if (lower.includes(key) || key.includes(lower)) return value;
  }

  return 'other';
}

// Add Pacific timezone offset to raw GHL times
function addPacificTimezone(timeStr) {
  if (!timeStr) return timeStr;
  let isoTime = timeStr.includes('T') ? timeStr : timeStr.replace(' ', 'T');
  if (!isoTime.match(/[Z]$/) && !isoTime.match(/[+-]\d{2}:\d{2}$/)) {
    const month = parseInt(isoTime.substring(5, 7));
    const offset = (month >= 3 && month <= 10) ? '-07:00' : '-08:00';
    isoTime += offset;
  }
  return isoTime;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const results = {
    found: 0,
    migrated: 0,
    skipped: 0,
    errors: [],
  };

  try {
    const now = new Date();
    const nowStr = now.toISOString().split('T')[0];

    // How far into the future to look (default 90 days)
    const { days } = req.body || {};
    const futureDays = days || 90;
    const futureDate = new Date(now);
    futureDate.setDate(futureDate.getDate() + futureDays);
    const futureDateStr = futureDate.toISOString().split('T')[0];

    console.log('=== MIGRATE GHL APPOINTMENTS ===');
    console.log(`Looking for future appointments: ${nowStr} to ${futureDateStr}`);

    // Get all patients with GHL contact IDs
    const { data: patients } = await supabase
      .from('patients')
      .select('id, name, ghl_contact_id, phone')
      .not('ghl_contact_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(500);

    if (!patients || patients.length === 0) {
      return res.status(200).json({ success: true, message: 'No linked patients found', ...results });
    }

    console.log(`Checking ${patients.length} patients for future appointments`);

    // Fetch appointments for each patient in batches
    const batchSize = 40;
    for (let i = 0; i < patients.length; i += batchSize) {
      const batch = patients.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(async (patient) => {
          try {
            const aptsUrl = `https://services.leadconnectorhq.com/contacts/${patient.ghl_contact_id}/appointments`;
            const aptsResponse = await fetch(aptsUrl, {
              headers: {
                'Authorization': `Bearer ${GHL_API_KEY}`,
                'Version': '2021-07-28',
              },
            });

            if (!aptsResponse.ok) return [];

            const aptsData = await aptsResponse.json();
            const appointments = aptsData.events || aptsData.appointments || [];

            // Filter to future appointments only
            return appointments
              .filter(apt => {
                const startTime = apt.startTime || apt.start_time || '';
                const aptDate = startTime.split(/[T ]/)[0];
                const status = (apt.status || apt.appointmentStatus || '').toLowerCase();
                return aptDate >= nowStr && aptDate <= futureDateStr &&
                  (status === 'scheduled' || status === 'confirmed' || status === 'booked' || !status);
              })
              .map(apt => ({ ...apt, patient }));
          } catch {
            return [];
          }
        })
      );

      for (const appointments of batchResults) {
        for (const apt of appointments) {
          results.found++;
          const patient = apt.patient;
          const appointmentId = apt.id || apt.appointmentId;

          // Extract calendar/service name
          const titleParts = (apt.title || '').split(' - ');
          const calendarName = titleParts.length > 1 ? titleParts.slice(1).join(' - ') : (apt.calendar?.name || apt.calendarName || apt.title || 'Appointment');
          const serviceName = calendarName;
          const serviceCategory = getServiceCategory(calendarName);

          let startTimeVal = addPacificTimezone(apt.startTime || apt.start_time || '');
          let endTimeVal = addPacificTimezone(apt.endTime || apt.end_time || '');

          // Calculate duration
          let durationMinutes = 30; // default
          if (startTimeVal && endTimeVal) {
            const diff = new Date(endTimeVal) - new Date(startTimeVal);
            if (diff > 0) durationMinutes = Math.round(diff / 60000);
          }

          try {
            const { error: upsertError } = await supabase
              .from('appointments')
              .upsert({
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
              }, { onConflict: 'ghl_appointment_id' });

            if (upsertError) {
              results.errors.push({ patient: patient.name, appointmentId, error: upsertError.message });
            } else {
              results.migrated++;
            }
          } catch (e) {
            results.errors.push({ patient: patient.name, appointmentId, error: e.message });
          }
        }
      }
    }

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
