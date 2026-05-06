// /pages/api/admin/services/options.js
// Returns the dropdown data the admin Services UI needs in one call:
// active employees (for the providers picker), locations, form catalog,
// and the supported automation actions.

import { createClient } from '@supabase/supabase-js';
import { FORM_DEFINITIONS } from '../../../../lib/form-bundles';
import { requireAuth } from '../../../../lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const AUTOMATION_ACTIONS = [
  { value: 'decrement',    label: 'Decrement Package Sessions',  description: 'Subtract 1 from the patient\'s active package on this booking' },
  { value: 'track_visit',  label: 'Track Visit on Protocol',     description: 'Log this booking as a visit on the patient\'s active protocol' },
  { value: 'lab_journey',  label: 'Lab Pipeline Stage',          description: 'Advance the patient through the lab review pipeline' },
  { value: 'log',          label: 'Log Only',                    description: 'Just record the booking — no further automation' },
  { value: 'none',         label: 'No Automation',               description: 'Explicitly opt out (skip the default behavior)' },
];

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const employee = await requireAuth(req, res);
  if (!employee) return;

  try {
    const [employees, locations, addonServices] = await Promise.all([
      supabase
        .from('employees')
        .select('id, name, title')
        .eq('is_active', true)
        .order('name'),
      supabase
        .from('locations')
        .select('id, short_name, name, is_active')
        .eq('is_active', true)
        .order('sort_order'),
      supabase
        .from('services')
        .select('id, name, category, duration_minutes, price_cents')
        .eq('is_active', true)
        .eq('is_addon', true)
        .order('category')
        .order('name'),
    ]);

    const forms = Object.entries(FORM_DEFINITIONS).map(([id, info]) => ({
      id,
      name: info.name,
      time: info.time,
    }));

    return res.status(200).json({
      success: true,
      employees: employees.data || [],
      locations: locations.data || [],
      forms,
      automation_actions: AUTOMATION_ACTIONS,
      addon_services: addonServices.data || [],
    });
  } catch (e) {
    console.error('[admin/services/options] error:', e);
    return res.status(500).json({ error: e.message });
  }
}
