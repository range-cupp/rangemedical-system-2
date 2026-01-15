// /pages/api/protocols/[id]/add-injections.js
// Add injections to a weight loss protocol
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { addGHLNote, updateGHLContact } from '../../../../lib/ghl-sync';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const { injections, notes } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Protocol ID required' });
  }

  if (!injections || injections < 1) {
    return res.status(400).json({ error: 'Valid injection count required' });
  }

  try {
    // Get existing protocol
    const { data: protocol, error: fetchError } = await supabase
      .from('protocols')
      .select(`
        *,
        patients (
          id,
          name,
          ghl_contact_id
        )
      `)
      .eq('id', id)
      .single();

    if (fetchError || !protocol) {
      return res.status(404).json({ error: 'Protocol not found' });
    }

    // Calculate new totals (stored as sessions in DB)
    const today = new Date();
    const currentTotal = protocol.total_sessions || 0;
    const newTotal = currentTotal + parseInt(injections);
    
    // Build renewal note
    const renewalNote = notes 
      ? `Added ${injections} injections. Notes: ${notes}`
      : `Added ${injections} injections`;

    const existingNotes = protocol.notes || '';
    const updatedNotes = existingNotes 
      ? `${existingNotes}\n\n[${today.toISOString().split('T')[0]}] ${renewalNote}`
      : `[${today.toISOString().split('T')[0]}] ${renewalNote}`;

    // Update protocol
    const { data: updated, error: updateError } = await supabase
      .from('protocols')
      .update({
        total_sessions: newTotal,
        status: 'active',
        notes: updatedNotes
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Update error:', updateError);
      return res.status(500).json({ error: 'Failed to add injections' });
    }

    // Sync to GHL
    const contactId = protocol.patients?.ghl_contact_id;
    const patientName = protocol.patients?.name || 'Unknown';

    if (contactId) {
      // Add note
      const ghlNote = `🔄 INJECTIONS ADDED

Medication: ${protocol.medication || 'N/A'}
Added: ${injections} injections
New Total: ${newTotal} injections
Used: ${protocol.sessions_used || 0}
Remaining: ${newTotal - (protocol.sessions_used || 0)}
${notes ? `Notes: ${notes}` : ''}`;

      await addGHLNote(contactId, ghlNote);

      // Update custom fields
      await updateGHLContact(contactId, {
        'wl__total_injections': String(newTotal),
        'wl__injections_remaining': String(newTotal - (protocol.sessions_used || 0))
      });
    }

    console.log(`✓ Protocol ${id}: Added ${injections} injections (new total: ${newTotal})`);

    return res.status(200).json({
      success: true,
      message: `Added ${injections} injections`,
      protocol: updated,
      new_total: newTotal
    });

  } catch (err) {
    console.error('Add injections error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
