// /pages/api/protocols/check-existing-wl.js
// Check if a patient has an existing WL protocol that can be extended
// Range Medical - 2026-02-08

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { patientId, medication } = req.query;

  if (!patientId) {
    return res.status(400).json({ error: 'patientId is required' });
  }

  try {
    // Get all WL protocols for this patient
    const { data: protocols, error } = await supabase
      .from('protocols')
      .select('*')
      .eq('patient_id', patientId)
      .eq('program_type', 'weight_loss')
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!protocols || protocols.length === 0) {
      return res.status(200).json({
        hasExisting: false,
        existingProtocol: null,
        canExtend: false,
        reason: 'No existing weight loss protocols found'
      });
    }

    // Find the most recent protocol that matches the medication (if specified)
    // and is either active OR expired within last 30 days
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let matchingProtocol = null;
    let canExtend = false;
    let reason = '';

    for (const protocol of protocols) {
      // Skip merged or deleted protocols
      if (protocol.status === 'merged' || protocol.status === 'deleted') {
        continue;
      }

      // Check if medication matches (if specified)
      if (medication && protocol.medication !== medication) {
        continue;
      }

      // Check status and end date
      if (protocol.status === 'active') {
        matchingProtocol = protocol;
        canExtend = true;
        reason = 'Active protocol found';
        break;
      }

      // Check if expired within 30 days
      if (protocol.end_date) {
        const endDate = new Date(protocol.end_date + 'T12:00:00');
        if (endDate >= thirtyDaysAgo) {
          matchingProtocol = protocol;
          canExtend = true;
          reason = 'Recently expired protocol found (within 30 days)';
          break;
        }
      }
    }

    // If no matching protocol found with same medication, check for different medication
    if (!matchingProtocol && medication) {
      const differentMedProtocol = protocols.find(p =>
        p.status !== 'merged' && p.status !== 'deleted' && (
          p.status === 'active' ||
          (p.end_date && new Date(p.end_date + 'T12:00:00') >= thirtyDaysAgo)
        )
      );

      if (differentMedProtocol) {
        return res.status(200).json({
          hasExisting: true,
          existingProtocol: differentMedProtocol,
          canExtend: false,
          reason: `Existing protocol uses different medication (${differentMedProtocol.medication}). Will create new protocol.`,
          differentMedication: true
        });
      }
    }

    if (matchingProtocol) {
      // Calculate days since end
      let daysSinceEnd = null;
      if (matchingProtocol.end_date) {
        const endDate = new Date(matchingProtocol.end_date + 'T12:00:00');
        daysSinceEnd = Math.floor((now - endDate) / (1000 * 60 * 60 * 24));
      }

      return res.status(200).json({
        hasExisting: true,
        existingProtocol: matchingProtocol,
        canExtend,
        reason,
        daysSinceEnd,
        startingDose: matchingProtocol.starting_dose || matchingProtocol.selected_dose,
        currentDose: matchingProtocol.selected_dose
      });
    }

    // No extendable protocol found
    return res.status(200).json({
      hasExisting: protocols.length > 0,
      existingProtocol: null,
      canExtend: false,
      reason: 'No recent protocols found (all expired more than 30 days ago)',
      expiredProtocolsCount: protocols.length
    });

  } catch (error) {
    console.error('Error checking existing WL protocols:', error);
    return res.status(500).json({ error: error.message });
  }
}
