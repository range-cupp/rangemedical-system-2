// /pages/api/cron/complete-protocols.js
// Auto-complete protocols that have passed their end date
// Run daily via Vercel Cron or external scheduler
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // Verify cron authorization
  const cronSecret = req.headers['x-cron-secret'] || req.query.secret;
  const authHeader = req.headers['authorization'];
  const isVercelCron = !!req.headers['x-vercel-cron-signature'];
  const isAuthorized = isVercelCron || (
    process.env.CRON_SECRET && (
      cronSecret === process.env.CRON_SECRET ||
      authHeader === `Bearer ${process.env.CRON_SECRET}`
    )
  );

  if (!isAuthorized) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  let completed = 0;
  let peptideTasksCreated = 0;
  let errors = [];

  try {
    // Find active protocols where end_date is yesterday or earlier
    // Exclude weight_loss, hrt, and peptide — those need manual follow-up for renewals
    const { data: expiredProtocols, error: fetchError } = await supabase
      .from('protocols')
      .select('id, program_name, program_type, end_date, patient_id')
      .eq('status', 'active')
      .not('program_type', 'like', 'weight_loss%')
      .not('program_type', 'like', 'hrt%')
      .neq('program_type', 'peptide')
      .lte('end_date', yesterdayStr);

    if (fetchError) {
      console.error('Error fetching expired protocols:', fetchError);
      errors.push(fetchError.message);
    }

    // Pre-fetch Damon & Tara employee IDs for peptide follow-up tasks
    let peptideTaskStaff = [];
    const { data: staffEmployees } = await supabase
      .from('employees')
      .select('id, email')
      .in('email', ['damon@range-medical.com', 'tara@range-medical.com']);
    if (staffEmployees) {
      peptideTaskStaff = staffEmployees.map(e => e.id);
    }

    if (expiredProtocols && expiredProtocols.length > 0) {
      console.log(`Found ${expiredProtocols.length} protocols to complete`);

      // Update each to completed
      for (const protocol of expiredProtocols) {
        const { error: updateError } = await supabase
          .from('protocols')
          .update({
            status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', protocol.id);

        if (updateError) {
          console.error(`Failed to complete protocol ${protocol.id}:`, updateError);
          errors.push(`${protocol.program_name} (${protocol.id}): ${updateError.message}`);
        } else {
          console.log(`Completed: ${protocol.program_name} (ended ${protocol.end_date})`);
          completed++;

          // Auto-create follow-up tasks for completed peptide protocols
          if (protocol.program_type === 'peptide' && peptideTaskStaff.length > 0) {
            try {
              // Get patient name
              const { data: patient } = await supabase
                .from('patients')
                .select('id, name, first_name, last_name')
                .eq('id', protocol.patient_id)
                .single();

              const patientName = patient?.name
                || `${patient?.first_name || ''} ${patient?.last_name || ''}`.trim()
                || 'Unknown';

              for (const empId of peptideTaskStaff) {
                await supabase.from('tasks').insert({
                  title: `Peptide Complete: Call ${patientName}`,
                  description: `${patientName}'s ${protocol.program_name} protocol has completed (ended ${protocol.end_date}). Call them to check how they're doing and discuss next steps.`,
                  assigned_to: empId,
                  assigned_by: empId,
                  patient_id: protocol.patient_id,
                  patient_name: patientName,
                  priority: 'medium',
                  status: 'pending',
                });
                peptideTasksCreated++;
              }
              console.log(`Peptide follow-up tasks created for ${patientName}`);
            } catch (taskErr) {
              console.error('Peptide follow-up task error:', taskErr);
            }
          }
        }
      }
    }

    // Peptide protocols: create follow-up tasks when end_date passes, but do NOT auto-complete
    // They stay active so staff can follow up on renewals (GH peptides are 90-day processes)
    if (peptideTaskStaff.length > 0) {
      const { data: expiredPeptides } = await supabase
        .from('protocols')
        .select('id, program_name, program_type, end_date, patient_id')
        .eq('status', 'active')
        .eq('program_type', 'peptide')
        .lte('end_date', yesterdayStr);

      if (expiredPeptides && expiredPeptides.length > 0) {
        for (const protocol of expiredPeptides) {
          // Check if follow-up task already exists to avoid duplicates
          const { data: existingTasks } = await supabase
            .from('tasks')
            .select('id')
            .eq('patient_id', protocol.patient_id)
            .ilike('title', `%Peptide Renewal%${protocol.program_name}%`)
            .eq('status', 'pending')
            .limit(1);

          if (existingTasks && existingTasks.length > 0) continue;

          const { data: patient } = await supabase
            .from('patients')
            .select('id, name, first_name, last_name')
            .eq('id', protocol.patient_id)
            .single();

          const patientName = patient?.name
            || `${patient?.first_name || ''} ${patient?.last_name || ''}`.trim()
            || 'Unknown';

          for (const empId of peptideTaskStaff) {
            await supabase.from('tasks').insert({
              title: `Peptide Renewal: Call ${patientName} — ${protocol.program_name}`,
              description: `${patientName}'s ${protocol.program_name} ended ${protocol.end_date}. Follow up to discuss renewal and next steps.`,
              assigned_to: empId,
              assigned_by: empId,
              patient_id: protocol.patient_id,
              patient_name: patientName,
              priority: 'medium',
              status: 'pending',
            });
            peptideTasksCreated++;
          }
          console.log(`Peptide renewal tasks created for ${patientName} — ${protocol.program_name}`);
        }
      }
    }

    // Also complete single-session IV protocols that are fully used up
    // These are single IVs that shouldn't be long-running protocols
    const { data: usedUpIVs, error: ivError } = await supabase
      .from('protocols')
      .select('id, program_name, total_sessions, sessions_used')
      .eq('status', 'active')
      .in('program_type', ['iv', 'iv_therapy', 'iv_sessions'])
      .not('total_sessions', 'is', null)
      .filter('total_sessions', 'lte', 1);

    if (ivError) {
      console.error('Error fetching single IV protocols:', ivError);
    }

    if (usedUpIVs && usedUpIVs.length > 0) {
      for (const protocol of usedUpIVs) {
        if ((protocol.sessions_used || 0) >= (protocol.total_sessions || 1)) {
          const { error: updateErr } = await supabase
            .from('protocols')
            .update({ status: 'completed', updated_at: new Date().toISOString() })
            .eq('id', protocol.id);
          if (!updateErr) {
            console.log(`Completed single IV: ${protocol.program_name}`);
            completed++;
          }
        }
      }
    }

    return res.status(200).json({
      success: true,
      completed,
      peptideTasksCreated,
      errors: errors.length > 0 ? errors : undefined,
      checked_date: yesterdayStr,
      run_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Cron job error:', error);
    return res.status(500).json({ 
      error: 'Server error', 
      details: error.message 
    });
  }
}
