// =====================================================
// GHL WEBHOOK HANDLER - RANGE IV (WORKFLOW TRIGGER)
// /pages/api/webhooks/ghl-hrt-appointment.js
// Works with GHL Workflow that fires on Range IV appointment completion
// Range Medical
// =====================================================

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://teivfptpozltpqwahgdl.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const payload = req.body;
    
    console.log('=== GHL HRT WEBHOOK (Workflow Trigger) ===');

    // GHL Workflow sends contact_id directly in the payload
    const contactId = payload.contact_id || payload.contactId || payload.contact?.id;
    const contactName = payload.full_name || payload.fullName || `${payload.first_name || ''} ${payload.last_name || ''}`.trim();
    const workflowName = payload.workflow?.name || '';
    
    console.log('Contact ID:', contactId);
    console.log('Contact Name:', contactName);
    console.log('Workflow Name:', workflowName);

    // If no contact ID, we can't process
    if (!contactId) {
      console.log('No contact ID found');
      return res.status(200).json({ 
        success: false, 
        message: 'No contact ID in payload'
      });
    }

    // Check if this is a Range IV related workflow
    // The workflow name is "HRT Range IV Appointment Tracker"
    const isRangeIVWorkflow = workflowName.toLowerCase().includes('range iv') || 
                              workflowName.toLowerCase().includes('hrt') ||
                              workflowName.toLowerCase().includes('iv');

    // Also check if "Range IV" appears anywhere in the payload (calendar name, etc.)
    const payloadStr = JSON.stringify(payload).toLowerCase();
    const hasRangeIVInPayload = payloadStr.includes('range iv');

    console.log('Is Range IV Workflow:', isRangeIVWorkflow);
    console.log('Has Range IV in payload:', hasRangeIVInPayload);

    if (!isRangeIVWorkflow && !hasRangeIVInPayload) {
      console.log('Not a Range IV workflow trigger');
      return res.status(200).json({ 
        success: true, 
        message: 'Not a Range IV workflow'
      });
    }

    // Log this webhook call
    await logWebhook(contactId, contactName, workflowName, payload);

    // Since this workflow only fires when Range IV appointment is completed,
    // we can mark the IV as used immediately
    console.log('Marking IV as used for contact:', contactId);
    
    const result = await markIvUsed(contactId);

    if (!result.success) {
      console.error('Failed to mark IV as used:', result.error);
      
      // Add a note to the contact in GHL about the failure
      await addGHLNote(contactId, `⚠️ HRT IV Webhook: Could not mark IV as used - ${result.error}`);
      
      return res.status(200).json({ 
        success: false, 
        error: result.error,
        contactId
      });
    }

    console.log('✓ IV marked as used successfully!');
    console.log('  Membership ID:', result.data?.membership_id);
    console.log('  Period ID:', result.data?.period_id);

    // Add success note to GHL contact
    await addGHLNote(contactId, `✅ Range IV marked as used for ${new Date().toLocaleDateString()}`);

    return res.status(200).json({
      success: true,
      message: 'IV marked as used successfully',
      contactId,
      data: result.data
    });

  } catch (error) {
    console.error('Webhook handler error:', error);
    return res.status(200).json({ 
      success: false, 
      error: error.message 
    });
  }
}

// =====================================================
// Log webhook to database
// =====================================================
async function logWebhook(contactId, contactName, workflowName, payload) {
  try {
    await supabase
      .from('hrt_iv_appointment_log')
      .insert({
        ghl_appointment_id: `workflow-${Date.now()}`,
        ghl_contact_id: contactId,
        appointment_title: workflowName || 'Range IV (Workflow)',
        appointment_date: new Date().toISOString(),
        appointment_status: 'workflow_triggered',
        webhook_payload: payload
      });
    console.log('Webhook logged to database');
  } catch (error) {
    console.error('Error logging webhook:', error);
  }
}

// =====================================================
// Mark IV as used
// =====================================================
async function markIvUsed(contactId) {
  try {
    const { data, error } = await supabase.rpc('mark_iv_used', {
      p_contact_id: contactId,
      p_appointment_id: `workflow-${Date.now()}`,
      p_appointment_date: new Date().toISOString()
    });

    if (error) {
      console.error('Supabase RPC error:', error);
      throw error;
    }

    // Check if the function returned an error
    if (data && data.success === false) {
      return { success: false, error: data.error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in markIvUsed:', error);
    return { success: false, error: error.message };
  }
}

// =====================================================
// Add note to GHL contact
// =====================================================
async function addGHLNote(contactId, noteText) {
  const GHL_API_KEY = process.env.GHL_API_KEY || 'pit-3077d6b0-6f08-4cb6-b74e-be7dd765e91d';
  
  try {
    const response = await fetch(
      `https://services.leadconnectorhq.com/contacts/${contactId}/notes`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GHL_API_KEY}`,
          'Version': '2021-07-28',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          body: noteText
        })
      }
    );

    if (!response.ok) {
      console.error('Failed to add GHL note:', await response.text());
    } else {
      console.log('GHL note added successfully');
    }
  } catch (error) {
    console.error('Error adding GHL note:', error);
  }
}
