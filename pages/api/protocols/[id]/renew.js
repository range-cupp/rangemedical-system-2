// /pages/api/protocols/[id]/renew.js
// Renew/extend a protocol
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { addGHLNote, addGHLTag } from '../../../../lib/ghl-sync';

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
  const { duration_days, notes } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Protocol ID required' });
  }

  if (!duration_days || duration_days < 1) {
    return res.status(400).json({ error: 'Valid duration_days required' });
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

    // Calculate new end date from today
    const today = new Date();
    const newEndDate = new Date(today);
    newEndDate.setDate(newEndDate.getDate() + parseInt(duration_days));
    const newEndDateStr = newEndDate.toISOString().split('T')[0];

    // Update protocol
    const renewalNote = notes 
      ? `Renewed for ${duration_days} days. Notes: ${notes}`
      : `Renewed for ${duration_days} days`;

    const existingNotes = protocol.notes || '';
    const updatedNotes = existingNotes 
      ? `${existingNotes}\n\n[${today.toISOString().split('T')[0]}] ${renewalNote}`
      : `[${today.toISOString().split('T')[0]}] ${renewalNote}`;

    const { data: updated, error: updateError } = await supabase
      .from('protocols')
      .update({
        end_date: newEndDateStr,
        status: 'active',
        notes: updatedNotes
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Update error:', updateError);
      return res.status(500).json({ error: 'Failed to renew protocol' });
    }

    // Sync to GHL
    const contactId = protocol.patients?.ghl_contact_id;
    const patientName = protocol.patients?.name || 'Unknown';

    if (contactId) {
      // Add renewal note
      const ghlNote = `🔄 PROTOCOL RENEWED

Peptide: ${protocol.medication || 'N/A'}
New End Date: ${newEndDateStr}
Duration: ${duration_days} days
${notes ? `Notes: ${notes}` : ''}`;

      await addGHLNote(contactId, ghlNote);

      // Re-add active tag based on delivery method
      if (protocol.program_type === 'peptide') {
        const tag = protocol.delivery_method === 'in_clinic' 
          ? 'Peptide - In Clinic' 
          : 'Peptide - Take Home';
        await addGHLTag(contactId, tag);
      }
    }

    console.log(`✓ Protocol ${id} renewed for ${duration_days} days`);

    return res.status(200).json({
      success: true,
      message: `Protocol renewed for ${duration_days} days`,
      protocol: updated,
      new_end_date: newEndDateStr
    });

  } catch (err) {
    console.error('Renew error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
