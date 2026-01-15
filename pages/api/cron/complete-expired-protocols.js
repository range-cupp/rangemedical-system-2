// /pages/api/cron/complete-expired-protocols.js
// Automatically marks protocols as completed when end_date has passed
// Run daily via Vercel Cron or external cron service
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // Verify cron secret to prevent unauthorized access
  const cronSecret = req.headers['x-cron-secret'] || req.query.secret;
  
  if (cronSecret !== process.env.CRON_SECRET && process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Find all active protocols that have expired
    const { data: expiredProtocols, error: fetchError } = await supabase
      .from('protocols')
      .select('id, patient_name, program_name, end_date')
      .eq('status', 'active')
      .lt('end_date', today);

    if (fetchError) {
      console.error('Error fetching expired protocols:', fetchError);
      return res.status(500).json({ error: 'Failed to fetch protocols' });
    }

    if (!expiredProtocols || expiredProtocols.length === 0) {
      return res.status(200).json({ 
        success: true, 
        message: 'No expired protocols to update',
        updated: 0,
        date: today
      });
    }

    // Update all expired protocols to completed
    const { error: updateError } = await supabase
      .from('protocols')
      .update({ 
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('status', 'active')
      .lt('end_date', today);

    if (updateError) {
      console.error('Error updating protocols:', updateError);
      return res.status(500).json({ error: 'Failed to update protocols' });
    }

    // Log the results
    console.log(`[CRON] Completed ${expiredProtocols.length} expired protocols:`, 
      expiredProtocols.map(p => `${p.patient_name} - ${p.program_name} (ended ${p.end_date})`));

    return res.status(200).json({
      success: true,
      message: `Marked ${expiredProtocols.length} protocols as completed`,
      updated: expiredProtocols.length,
      date: today,
      protocols: expiredProtocols.map(p => ({
        patient: p.patient_name,
        program: p.program_name,
        ended: p.end_date
      }))
    });

  } catch (error) {
    console.error('Cron job error:', error);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
}
