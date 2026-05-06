// /pages/api/bookings/event-types.js
// Returns the service catalog used by CalendarView's booking wizard.
// Cal.com is no longer in the loop — this reads from the local
// `services` + `service_providers` + `employees` tables. Response shape
// is preserved (id, title, slug, length, hosts) so existing callers
// don't have to change.

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { data: services, error: svcErr } = await supabase
      .from('services')
      .select('id, name, slug, duration_minutes, legacy_calcom_event_type_id, sort_order, variants, price_cents, is_addon, category, group_label, subtype, requires_blood_work, has_modality, allowed_modalities')
      .eq('is_active', true)
      .order('sort_order');
    if (svcErr) throw svcErr;

    const serviceIds = (services || []).map(s => s.id);
    let providerRowsByService = {};
    let addonRowsByService = {};
    if (serviceIds.length > 0) {
      const [providerRes, addonRes] = await Promise.all([
        supabase
          .from('service_providers')
          .select(`
            service_id, sort_order, display_label,
            employee:employees!inner ( id, name, username, calcom_user_id, is_active )
          `)
          .in('service_id', serviceIds),
        supabase
          .from('service_addons')
          .select('service_id, addon_service_id, sort_order')
          .in('service_id', serviceIds)
          .order('sort_order'),
      ]);
      if (providerRes.error) throw providerRes.error;
      if (addonRes.error) throw addonRes.error;

      for (const row of (providerRes.data || [])) {
        if (row.employee?.is_active === false) continue;
        if (!providerRowsByService[row.service_id]) providerRowsByService[row.service_id] = [];
        providerRowsByService[row.service_id].push(row);
      }
      for (const row of (addonRes.data || [])) {
        if (!addonRowsByService[row.service_id]) addonRowsByService[row.service_id] = [];
        addonRowsByService[row.service_id].push(row.addon_service_id);
      }
    }

    // Build a lookup for add-on metadata so each parent service can include
    // resolved add-on objects (not just IDs) in its response.
    const serviceById = {};
    for (const s of (services || [])) serviceById[s.id] = s;

    const simplified = (services || [])
      // Add-on services aren't directly bookable — they only show up under
      // a parent service's "Add-ons" picker.
      .filter(s => !s.is_addon)
      .map(s => {
        const provs = (providerRowsByService[s.id] || [])
          .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
        const hosts = provs.map(p => ({
          userId: p.employee.calcom_user_id || null,
          name: p.display_label || p.employee.name || '',
          username: p.employee.username || '',
        }));
        const addons = (addonRowsByService[s.id] || [])
          .map(addonId => serviceById[addonId])
          .filter(Boolean)
          .map(a => ({
            id: a.id,
            slug: a.slug,
            name: a.name,
            duration_minutes: a.duration_minutes,
            price_cents: a.price_cents,
            category: a.category,
            // An add-on can itself have dose variants (e.g., Vitamin C 25g–75g),
            // surfaced as a per-addon dose dropdown in the booking wizard.
            variants: Array.isArray(a.variants) ? a.variants : [],
          }));
        return {
          // Keep id as the legacy Cal.com event type id when available so
          // existing CalendarView code that round-trips eventTypeId in URLs
          // (e.g. via the slots endpoint) keeps working unchanged.
          id: s.legacy_calcom_event_type_id || s.id,
          title: s.name,
          slug: s.slug,
          length: s.duration_minutes,
          description: null,
          hosts,
          // Extra fields needed by the calendar booking wizard
          // (CalendarView.js consumes these alongside the legacy Cal.com fields).
          category: s.category,
          group_label: s.group_label || null,
          subtype: s.subtype || null,
          requires_blood_work: !!s.requires_blood_work,
          has_modality: !!s.has_modality,
          allowed_modalities: Array.isArray(s.allowed_modalities) ? s.allowed_modalities : null,
          variants: Array.isArray(s.variants) ? s.variants : [],
          price_cents: s.price_cents ?? null,
          addons,
        };
      });

    return res.status(200).json({ success: true, eventTypes: simplified });
  } catch (e) {
    console.error('Event types API error:', e);
    return res.status(500).json({ error: 'Server error', details: e.message });
  }
}
