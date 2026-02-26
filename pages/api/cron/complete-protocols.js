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
  let errors = [];

  try {
    // Find active protocols where end_date is yesterday or earlier
    const { data: expiredProtocols, error: fetchError } = await supabase
      .from('protocols')
      .select('id, program_name, program_type, end_date, patient_id')
      .eq('status', 'active')
      .not('program_type', 'in', '("weight_loss","hrt")')
      .lte('end_date', yesterdayStr);

    if (fetchError) {
      console.error('Error fetching expired protocols:', fetchError);
      errors.push(fetchError.message);
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
        }
      }
    }

    return res.status(200).json({
      success: true,
      completed,
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
