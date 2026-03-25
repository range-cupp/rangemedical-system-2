// lib/pipeline-insert.js
// Shared utility to auto-insert leads into the sales pipeline
// Called from form submit endpoints (assessment, start, energy-check, research, cellular-reset)

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Insert a lead into the sales_pipeline table
 * @param {Object} opts
 * @param {string} opts.first_name - Required
 * @param {string} opts.last_name
 * @param {string} opts.email
 * @param {string} opts.phone
 * @param {string} opts.source - Where they came from (assessment, start_funnel, energy_check, research, cellular_reset, referral, etc.)
 * @param {string} opts.lead_type - Type key for dedup (assessment, start, energy_check, research, cellular_reset)
 * @param {string} opts.lead_id - UUID of the source lead record (for dedup)
 * @param {string} opts.patient_id - UUID of the patient record if known
 * @param {string} opts.path - Interest path (injury, energy, labs)
 * @param {string} opts.stage - Pipeline stage (default: new_lead)
 * @param {string} opts.notes
 * @param {number} opts.urgency
 */
export async function insertIntoPipeline(opts) {
  if (!supabaseUrl || !supabaseKey) return null;

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Check for duplicate by email (if provided) to avoid double-entries
    if (opts.email) {
      const { data: existing } = await supabase
        .from('sales_pipeline')
        .select('id')
        .eq('email', opts.email.toLowerCase().trim())
        .limit(1);

      if (existing && existing.length > 0) {
        return existing[0]; // Already in pipeline
      }
    }

    const { data, error } = await supabase
      .from('sales_pipeline')
      .insert({
        first_name: opts.first_name,
        last_name: opts.last_name || '',
        email: (opts.email || '').toLowerCase().trim(),
        phone: opts.phone || '',
        source: opts.source || 'website',
        lead_type: opts.lead_type || 'manual',
        lead_id: opts.lead_id || null,
        patient_id: opts.patient_id || null,
        path: opts.path || null,
        stage: opts.stage || 'new_lead',
        notes: opts.notes || null,
        urgency: opts.urgency || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Pipeline insert error:', error.message);
      return null;
    }

    return data;
  } catch (err) {
    console.error('Pipeline insert exception:', err);
    return null;
  }
}
