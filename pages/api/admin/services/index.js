// /pages/api/admin/services/index.js
// GET: list every service with rolled-up counts (providers, locations,
//      required forms, automations) for the admin Services page.
// POST: create a new service. Caller can include providers/locations/
//       forms/automations/prep to populate the related tables in one shot.

import { createClient } from '@supabase/supabase-js';
import { requireAuth, hasPermission, logAction } from '../../../../lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const employee = await requireAuth(req, res);
  if (!employee) return;

  if (req.method === 'GET') return handleList(req, res);
  if (req.method === 'POST') {
    if (!hasPermission(employee, 'can_manage_employees')) {
      return res.status(403).json({ error: 'Permission denied' });
    }
    return handleCreate(req, res, employee);
  }
  return res.status(405).json({ error: 'Method not allowed' });
}

async function handleList(req, res) {
  try {
    const { data: services, error } = await supabase
      .from('services')
      .select('id, name, slug, category, group_label, duration_minutes, buffer_minutes, requires_blood_work, has_modality, is_active, is_public_bookable, is_addon, sort_order, variants, price_cents')
      .order('group_label', { ascending: true, nullsFirst: false })
      .order('sort_order', { ascending: true });
    if (error) throw error;

    if (!services || services.length === 0) {
      return res.status(200).json({ success: true, services: [] });
    }
    const ids = services.map(s => s.id);

    const [providers, locations, forms, automations, prep, addons] = await Promise.all([
      supabase.from('service_providers').select('service_id').in('service_id', ids),
      supabase.from('service_locations').select('service_id').in('service_id', ids),
      supabase.from('service_required_forms').select('service_id').in('service_id', ids),
      supabase.from('service_automations').select('service_id, action').in('service_id', ids),
      supabase.from('service_prep_instructions').select('service_id, sms_body, is_active').in('service_id', ids),
      supabase.from('service_addons').select('service_id').in('service_id', ids),
    ]);

    const countBy = (rows, key = 'service_id') => {
      const m = {};
      for (const r of (rows.data || [])) m[r[key]] = (m[r[key]] || 0) + 1;
      return m;
    };
    const providerCount = countBy(providers);
    const locationCount = countBy(locations);
    const formCount = countBy(forms);
    const addonCount = countBy(addons);

    const automationsByService = {};
    for (const a of (automations.data || [])) {
      if (!automationsByService[a.service_id]) automationsByService[a.service_id] = [];
      automationsByService[a.service_id].push(a.action);
    }
    const prepByService = {};
    for (const p of (prep.data || [])) {
      prepByService[p.service_id] = !!(p.is_active && (p.sms_body || '').trim());
    }

    const enriched = services.map(s => ({
      ...s,
      provider_count: providerCount[s.id] || 0,
      location_count: locationCount[s.id] || 0,
      form_count: formCount[s.id] || 0,
      addon_count: addonCount[s.id] || 0,
      variant_count: Array.isArray(s.variants) ? s.variants.length : 0,
      automation_actions: automationsByService[s.id] || [],
      has_prep: !!prepByService[s.id],
    }));

    return res.status(200).json({ success: true, services: enriched });
  } catch (e) {
    console.error('[admin/services] list error:', e);
    return res.status(500).json({ error: e.message });
  }
}

async function handleCreate(req, res, employee) {
  const {
    name, slug, category, group_label,
    duration_minutes, buffer_minutes,
    min_notice_hours, booking_window_days,
    description, has_modality, requires_blood_work, subtype, color,
    is_active, is_public_bookable, is_addon, sort_order,
    variants, price_cents,
    providers,
    location_ids,
    form_ids,
    automation_actions,
    addon_service_ids,
    prep,
  } = req.body || {};

  if (!name || !slug || !category || !duration_minutes) {
    return res.status(400).json({
      error: 'name, slug, category, and duration_minutes are required',
    });
  }

  try {
    const { data: created, error: createErr } = await supabase
      .from('services')
      .insert({
        name,
        slug,
        category,
        group_label: group_label || null,
        duration_minutes,
        buffer_minutes: buffer_minutes ?? 0,
        min_notice_hours: min_notice_hours ?? 0,
        booking_window_days: booking_window_days ?? 60,
        description: description || null,
        has_modality: !!has_modality,
        requires_blood_work: !!requires_blood_work,
        subtype: subtype || null,
        color: color || null,
        is_active: is_active !== false,
        is_public_bookable: !!is_public_bookable,
        is_addon: !!is_addon,
        sort_order: sort_order ?? 0,
        variants: normalizeVariants(variants),
        price_cents: price_cents == null || price_cents === '' ? null : parseInt(price_cents, 10),
      })
      .select()
      .single();
    if (createErr) throw createErr;

    await writeRelations(created.id, { providers, location_ids, form_ids, automation_actions, addon_service_ids, prep });

    await logAction({
      employeeId: employee.id,
      employeeName: employee.name,
      action: 'create_service',
      resourceType: 'service',
      resourceId: created.id,
      details: { slug, name, category },
      req,
    });

    return res.status(200).json({ success: true, service: created });
  } catch (e) {
    console.error('[admin/services] create error:', e);
    return res.status(500).json({ error: e.message });
  }
}

// Coerce variants to the canonical shape the booking wizard expects.
// Drops malformed entries silently rather than 400-ing the whole save.
export function normalizeVariants(variants) {
  if (!Array.isArray(variants)) return [];
  return variants
    .map(v => {
      const value = String(v?.value ?? '').trim();
      const label = String(v?.label ?? value).trim();
      if (!value || !label) return null;
      const price = v?.price_cents == null || v?.price_cents === ''
        ? null : parseInt(v.price_cents, 10);
      const dur = v?.duration_minutes == null || v?.duration_minutes === ''
        ? null : parseInt(v.duration_minutes, 10);
      return {
        value,
        label,
        ...(Number.isFinite(price) ? { price_cents: price } : {}),
        ...(Number.isFinite(dur) ? { duration_minutes: dur } : {}),
      };
    })
    .filter(Boolean);
}

// Shared by create + update — replace nested rows in place.
export async function writeRelations(serviceId, payload = {}) {
  const { providers, location_ids, form_ids, automation_actions, addon_service_ids, prep } = payload;

  if (Array.isArray(addon_service_ids)) {
    await supabase.from('service_addons').delete().eq('service_id', serviceId);
    if (addon_service_ids.length > 0) {
      const rows = addon_service_ids
        .filter(id => id && id !== serviceId)
        .map((addonId, idx) => ({ service_id: serviceId, addon_service_id: addonId, sort_order: idx }));
      if (rows.length > 0) {
        const { error } = await supabase.from('service_addons').insert(rows);
        if (error) throw error;
      }
    }
  }

  if (Array.isArray(providers)) {
    await supabase.from('service_providers').delete().eq('service_id', serviceId);
    if (providers.length > 0) {
      const rows = providers.map((p, idx) => ({
        service_id: serviceId,
        employee_id: p.employee_id,
        display_label: p.display_label || null,
        sort_order: p.sort_order ?? idx,
      }));
      const { error } = await supabase.from('service_providers').insert(rows);
      if (error) throw error;
    }
  }

  if (Array.isArray(location_ids)) {
    await supabase.from('service_locations').delete().eq('service_id', serviceId);
    if (location_ids.length > 0) {
      const rows = location_ids.map(loc => ({ service_id: serviceId, location_id: loc }));
      const { error } = await supabase.from('service_locations').insert(rows);
      if (error) throw error;
    }
  }

  if (Array.isArray(form_ids)) {
    await supabase.from('service_required_forms').delete().eq('service_id', serviceId);
    if (form_ids.length > 0) {
      const rows = form_ids.map((id, idx) => ({ service_id: serviceId, form_id: id, sort_order: idx }));
      const { error } = await supabase.from('service_required_forms').insert(rows);
      if (error) throw error;
    }
  }

  if (Array.isArray(automation_actions)) {
    await supabase.from('service_automations').delete().eq('service_id', serviceId);
    if (automation_actions.length > 0) {
      const rows = automation_actions.map(action => ({ service_id: serviceId, action, config: {}, is_active: true }));
      const { error } = await supabase.from('service_automations').insert(rows);
      if (error) throw error;
    }
  }

  if (prep !== undefined) {
    if (prep === null) {
      await supabase.from('service_prep_instructions').delete().eq('service_id', serviceId);
    } else {
      await supabase.from('service_prep_instructions').upsert({
        service_id: serviceId,
        sms_body: prep.sms_body || null,
        email_subject: prep.email_subject || null,
        email_body: prep.email_body || null,
        send_hours_before: prep.send_hours_before ?? 24,
        is_active: prep.is_active !== false,
      }, { onConflict: 'service_id' });
    }
  }
}
