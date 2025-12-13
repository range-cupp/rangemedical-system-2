// /pages/api/cron/process-milestones.js
// Daily processor for protocol milestones
// Trigger: Vercel Cron, Supabase Edge Function, or external scheduler
// Recommended: Run daily at 8:00 AM local time

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://teivfptpozltpqwahgdl.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const GHL_API_KEY = process.env.GHL_API_KEY || 'pit-3077d6b0-6f08-4cb6-b74e-be7dd765e91d';
const GHL_API_BASE = 'https://services.leadconnectorhq.com';

// =====================================================
// GHL HELPER FUNCTIONS
// =====================================================

async function addGHLNote(contactId, noteBody) {
  try {
    const response = await fetch(`${GHL_API_BASE}/contacts/${contactId}/notes`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GHL_API_KEY}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28'
      },
      body: JSON.stringify({ body: noteBody })
    });
    return response.ok;
  } catch (error) {
    console.error('GHL note error:', error);
    return false;
  }
}

async function createGHLTask(contactId, title, dueDate, description) {
  try {
    const response = await fetch(`${GHL_API_BASE}/contacts/${contactId}/tasks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GHL_API_KEY}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28'
      },
      body: JSON.stringify({
        title,
        body: description,
        dueDate: new Date(dueDate).toISOString(),
        completed: false
      })
    });
    return response.ok;
  } catch (error) {
    console.error('GHL task error:', error);
    return false;
  }
}

async function updateGHLContactFields(contactId, fields) {
  try {
    const response = await fetch(`${GHL_API_BASE}/contacts/${contactId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${GHL_API_KEY}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28'
      },
      body: JSON.stringify({
        customFields: Object.entries(fields).map(([key, value]) => ({
          key,
          value: value?.toString() || ''
        }))
      })
    });
    return response.ok;
  } catch (error) {
    console.error('GHL update error:', error);
    return false;
  }
}

// =====================================================
// MILESTONE PROCESSORS
// =====================================================

async function processCheckIn(milestone, protocol) {
  console.log(`📋 Processing check-in: ${milestone.milestone_name} for ${protocol.patient_name}`);
  
  // Create task in GHL
  const taskCreated = await createGHLTask(
    protocol.ghl_contact_id,
    `${milestone.milestone_name} - ${protocol.patient_name}`,
    milestone.scheduled_date,
    `Protocol: ${protocol.program_name}\nPeptide: ${protocol.primary_peptide || 'N/A'}\n\nCheck in with patient about their protocol progress.`
  );
  
  // Add note
  await addGHLNote(
    protocol.ghl_contact_id,
    `📅 ${milestone.milestone_name} scheduled for ${protocol.program_name}`
  );
  
  return taskCreated;
}

async function processNearEnd(milestone, protocol) {
  console.log(`⏰ Processing near-end: ${protocol.patient_name}`);
  
  // Add note
  await addGHLNote(
    protocol.ghl_contact_id,
    `⚠️ PROTOCOL ENDING SOON\n━━━━━━━━━━━━━━━━━━━━━\nProgram: ${protocol.program_name}\nEnds: ${protocol.end_date}\nDays remaining: 3\n\nConsider reaching out about renewal/refill options.`
  );
  
  // Create follow-up task
  await createGHLTask(
    protocol.ghl_contact_id,
    `Protocol Ending - Contact ${protocol.patient_name}`,
    milestone.scheduled_date,
    `${protocol.program_name} is ending in 3 days. Reach out about:\n- How they're feeling\n- Results so far\n- Renewal/refill options`
  );
  
  return true;
}

async function processCompletion(milestone, protocol) {
  console.log(`✅ Processing completion: ${protocol.patient_name}`);
  
  // Update protocol status
  await supabase
    .from('protocols')
    .update({ status: 'completed', updated_at: new Date().toISOString() })
    .eq('id', protocol.id);
  
  // Update GHL contact
  await updateGHLContactFields(protocol.ghl_contact_id, {
    protocol_status: 'Completed',
    protocol_days_remaining: '0'
  });
  
  // Add note
  await addGHLNote(
    protocol.ghl_contact_id,
    `✅ PROTOCOL COMPLETED\n━━━━━━━━━━━━━━━━━━━━━\nProgram: ${protocol.program_name}\nCompleted: ${new Date().toISOString().split('T')[0]}\nDuration: ${protocol.duration_days} days\n\nPatient is now eligible for renewal.`
  );
  
  return true;
}

async function processRefillReminder(milestone, protocol) {
  console.log(`💊 Processing refill reminder: ${protocol.patient_name}`);
  
  // Update protocol status to ready_refill
  await supabase
    .from('protocols')
    .update({ status: 'ready_refill', updated_at: new Date().toISOString() })
    .eq('id', protocol.id);
  
  // Update GHL contact
  await updateGHLContactFields(protocol.ghl_contact_id, {
    protocol_status: 'Ready for Refill'
  });
  
  // Add note
  await addGHLNote(
    protocol.ghl_contact_id,
    `💊 READY FOR REFILL\n━━━━━━━━━━━━━━━━━━━━━\nProgram: ${protocol.program_name}\nLast protocol completed: ${protocol.end_date}\n\nPatient may be ready to continue their protocol.`
  );
  
  // Create task
  await createGHLTask(
    protocol.ghl_contact_id,
    `Refill Opportunity - ${protocol.patient_name}`,
    milestone.scheduled_date,
    `${protocol.program_name} completed. Follow up about:\n- Results from last protocol\n- Interest in continuing\n- Any adjustments needed`
  );
  
  return true;
}

// =====================================================
// MAIN PROCESSOR
// =====================================================

export default async function handler(req, res) {
  // Verify cron secret (optional security)
  const cronSecret = req.headers['x-cron-secret'];
  if (process.env.CRON_SECRET && cronSecret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  console.log('🔄 Starting daily milestone processor...');
  
  const results = {
    processed: 0,
    succeeded: 0,
    failed: 0,
    errors: []
  };

  try {
    // =========================================
    // 1. GET TODAY'S PENDING MILESTONES
    // =========================================
    const today = new Date().toISOString().split('T')[0];
    
    const { data: milestones, error: milestoneError } = await supabase
      .from('protocol_milestones')
      .select(`
        *,
        protocol:protocols(*)
      `)
      .eq('scheduled_date', today)
      .eq('status', 'pending');
    
    if (milestoneError) {
      throw new Error(`Failed to fetch milestones: ${milestoneError.message}`);
    }
    
    console.log(`📌 Found ${milestones?.length || 0} milestones for today`);
    
    // =========================================
    // 2. PROCESS EACH MILESTONE
    // =========================================
    for (const milestone of milestones || []) {
      results.processed++;
      
      try {
        const protocol = milestone.protocol;
        if (!protocol) {
          console.warn(`⚠️ No protocol found for milestone ${milestone.id}`);
          continue;
        }
        
        let success = false;
        
        switch (milestone.milestone_type) {
          case 'checkin_day7':
          case 'checkin_day14':
          case 'checkin_day21':
          case 'midpoint':
            success = await processCheckIn(milestone, protocol);
            break;
            
          case 'near_end':
            success = await processNearEnd(milestone, protocol);
            break;
            
          case 'completed':
            success = await processCompletion(milestone, protocol);
            break;
            
          case 'refill_reminder':
            success = await processRefillReminder(milestone, protocol);
            break;
            
          case 'start':
            // Start milestone is handled at creation time
            success = true;
            break;
            
          default:
            console.log(`ℹ️ Unknown milestone type: ${milestone.milestone_type}`);
            success = true;
        }
        
        // Update milestone status
        await supabase
          .from('protocol_milestones')
          .update({
            status: success ? 'completed' : 'failed',
            completed_at: new Date().toISOString(),
            automation_triggered_at: new Date().toISOString(),
            automation_result: success ? 'Success' : 'Failed',
            updated_at: new Date().toISOString()
          })
          .eq('id', milestone.id);
        
        if (success) {
          results.succeeded++;
        } else {
          results.failed++;
        }
        
      } catch (error) {
        console.error(`❌ Error processing milestone ${milestone.id}:`, error);
        results.failed++;
        results.errors.push({
          milestoneId: milestone.id,
          error: error.message
        });
      }
    }
    
    // =========================================
    // 3. UPDATE ACTIVE PROTOCOL DAYS REMAINING
    // =========================================
    const { data: activeProtocols } = await supabase
      .from('protocols')
      .select('id, ghl_contact_id, end_date, program_name')
      .eq('status', 'active');
    
    for (const protocol of activeProtocols || []) {
      const endDate = new Date(protocol.end_date);
      const today = new Date();
      const daysRemaining = Math.max(0, Math.ceil((endDate - today) / (1000 * 60 * 60 * 24)));
      
      // Update GHL contact
      await updateGHLContactFields(protocol.ghl_contact_id, {
        protocol_days_remaining: daysRemaining.toString()
      });
      
      // Auto-complete protocols that have passed their end date
      if (daysRemaining <= 0) {
        await supabase
          .from('protocols')
          .update({ status: 'completed', updated_at: new Date().toISOString() })
          .eq('id', protocol.id);
        
        await updateGHLContactFields(protocol.ghl_contact_id, {
          protocol_status: 'Completed'
        });
      }
    }
    
    console.log('✅ Daily processor complete:', results);
    
    return res.status(200).json({
      success: true,
      message: 'Milestone processing complete',
      results
    });

  } catch (error) {
    console.error('❌ Processor error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      results
    });
  }
}

// =====================================================
// VERCEL CRON CONFIG
// Add to vercel.json:
// {
//   "crons": [{
//     "path": "/api/cron/process-milestones",
//     "schedule": "0 15 * * *"  // 8 AM Pacific (UTC-7)
//   }]
// }
// =====================================================
