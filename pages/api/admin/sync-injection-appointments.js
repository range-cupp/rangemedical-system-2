// /pages/api/admin/sync-injection-appointments.js
// Sync clinic_appointments data to protocol visit tracking
// Range Medical - 2026-02-05
// GET = preview, POST = sync

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  const dryRun = req.method === 'GET';

  try {
    // Get all in-clinic protocols (HRT and Weight Loss)
    const { data: protocols, error: protocolsError } = await supabase
      .from('protocols')
      .select(`
        id,
        patient_id,
        program_type,
        medication,
        delivery_method,
        status,
        visit_frequency,
        last_visit_date,
        next_expected_date,
        sessions_used,
        total_sessions,
        patients (
          id,
          name,
          ghl_contact_id
        )
      `)
      .eq('delivery_method', 'in_clinic')
      .in('program_type', ['hrt', 'weight_loss'])
      .in('status', ['active', 'pending']);

    if (protocolsError) {
      return res.status(500).json({ error: protocolsError.message });
    }

    const results = {
      total: protocols.length,
      synced: [],
      errors: [],
      skipped: []
    };

    for (const protocol of protocols) {
      const ghlContactId = protocol.patients?.ghl_contact_id;
      const patientName = protocol.patients?.name || 'Unknown';

      if (!ghlContactId) {
        results.skipped.push({
          protocol_id: protocol.id,
          patient: patientName,
          reason: 'No GHL contact ID'
        });
        continue;
      }

      try {
        // Determine which calendar names to look for
        const calendarNames = protocol.program_type === 'hrt'
          ? ['Injection - Testosterone']
          : ['Injection - Weight Loss'];

        // Fetch appointments from clinic_appointments table
        const { data: appointments, error: aptError } = await supabase
          .from('clinic_appointments')
          .select('*')
          .eq('ghl_contact_id', ghlContactId)
          .in('calendar_name', calendarNames)
          .order('appointment_date', { ascending: false });

        if (aptError) {
          results.errors.push({
            protocol_id: protocol.id,
            patient: patientName,
            error: aptError.message
          });
          continue;
        }

        // Filter to completed/showed appointments
        const completedStatuses = ['showed', 'completed'];
        const completedAppointments = (appointments || []).filter(apt =>
          completedStatuses.includes((apt.status || '').toLowerCase())
        );

        // Find last completed visit
        const lastVisit = completedAppointments[0]; // Already sorted desc

        // Find next scheduled visit (future, not cancelled/no-show)
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        const futureAppointments = (appointments || []).filter(apt => {
          const status = (apt.status || '').toLowerCase();
          return apt.appointment_date >= todayStr &&
            !['cancelled', 'no_show', 'showed', 'completed'].includes(status);
        });

        // Sort future ascending
        futureAppointments.sort((a, b) =>
          new Date(a.appointment_date) - new Date(b.appointment_date)
        );
        const nextScheduled = futureAppointments[0];

        const syncData = {
          protocol_id: protocol.id,
          patient: patientName,
          program_type: protocol.program_type,
          ghl_contact_id: ghlContactId,
          appointments_found: appointments?.length || 0,
          completed_count: completedAppointments.length,
          last_visit: lastVisit ? {
            date: lastVisit.appointment_date,
            title: lastVisit.calendar_name,
            status: lastVisit.status
          } : null,
          next_scheduled: nextScheduled ? {
            date: nextScheduled.appointment_date,
            title: nextScheduled.calendar_name,
            status: nextScheduled.status
          } : null,
          current_values: {
            last_visit_date: protocol.last_visit_date,
            next_expected_date: protocol.next_expected_date,
            sessions_used: protocol.sessions_used
          }
        };

        if (dryRun) {
          results.synced.push(syncData);
        } else {
          // Actually update the protocol
          const updateData = {
            updated_at: new Date().toISOString()
          };

          if (lastVisit) {
            updateData.last_visit_date = lastVisit.appointment_date;
          }

          if (nextScheduled) {
            updateData.next_expected_date = nextScheduled.appointment_date;
          } else if (lastVisit) {
            // Calculate next expected based on visit frequency
            const visitFrequency = protocol.visit_frequency ||
              (protocol.program_type === 'weight_loss' ? 'weekly' : 'twice_weekly');

            const lastDate = new Date(lastVisit.appointment_date + 'T12:00:00');
            if (visitFrequency === 'weekly') {
              lastDate.setDate(lastDate.getDate() + 7);
            } else if (visitFrequency === 'twice_weekly') {
              lastDate.setDate(lastDate.getDate() + 3);
            } else if (visitFrequency === 'monthly') {
              lastDate.setDate(lastDate.getDate() + 30);
            } else {
              lastDate.setDate(lastDate.getDate() + 7);
            }
            updateData.next_expected_date = lastDate.toISOString().split('T')[0];
          }

          // For weight loss, update sessions_used based on completed appointments
          if (protocol.program_type === 'weight_loss' && completedAppointments.length > 0) {
            updateData.sessions_used = completedAppointments.length;
          }

          const { error: updateError } = await supabase
            .from('protocols')
            .update(updateData)
            .eq('id', protocol.id);

          if (updateError) {
            results.errors.push({
              protocol_id: protocol.id,
              patient: patientName,
              error: updateError.message
            });
          } else {
            syncData.updated = updateData;
            results.synced.push(syncData);
          }
        }

      } catch (err) {
        results.errors.push({
          protocol_id: protocol.id,
          patient: patientName,
          error: err.message
        });
      }
    }

    return res.status(200).json({
      success: true,
      dryRun,
      message: dryRun ? 'Preview only - use POST to sync' : 'Sync complete',
      results
    });

  } catch (error) {
    console.error('Sync injection appointments error:', error);
    return res.status(500).json({ error: error.message });
  }
}
