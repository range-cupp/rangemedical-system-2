// /pages/api/protocol-builder/share.js
// Save a protocol plan and return a shareable token for patient viewing

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { patientId, patientName, planItems, createdBy } = req.body;

  if (!planItems || planItems.length === 0) {
    return res.status(400).json({ error: 'Plan must have at least one item' });
  }

  const token = crypto.randomBytes(16).toString('hex');

  const { data, error } = await supabase
    .from('shared_plans')
    .insert({
      token,
      patient_id: patientId || null,
      patient_name: patientName || null,
      plan_data: planItems,
      created_by: createdBy || null,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    })
    .select('id, token')
    .single();

  if (error) {
    console.error('Error saving shared plan:', error);
    return res.status(500).json({ error: 'Failed to save plan' });
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://rangemedical.vercel.app';
  const shareUrl = `${baseUrl}/plan/${token}`;

  return res.status(200).json({ token, url: shareUrl });
}
