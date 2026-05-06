// /pages/api/admin/services/[id].js
// GET: full service detail with all related rows (providers, locations,
//      forms, automations, prep instructions).
// PATCH: update any subset of basics + nested relations.
// DELETE: soft-delete (sets is_active = false).

import { createClient } from '@supabase/supabase-js';
import { requireAuth, hasPermission, logAction } from '../../../../lib/auth';
import { writeRelations, normalizeVariants } from './index';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const employee = await requireAuth(req, res);
  if (!employee) return;

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'id is required' });

  if (req.method === 'GET') return handleGet(req, res, id);

  if (!hasPermission(employee, 'can_manage_employees')) {
    return res.status(403).json({ error: 'Permission denied' });
  }
  if (req.method === 'PATCH') return handlePatch(req, res, id, employee);
  if (req.method === 'DELETE') return handleDelete(req, res, id, employee);

  return res.status(405).json({ error: 'Method not allowed' });
}

async function handleGet(req, res, id) {
  try {
    const { data: service, error } = await supabase
      .from('services')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    if (!service) return res.status(404).json({ error: 'Service not found' });

    const [providers, locations, forms, automations, prep, addons] = await Promise.all([
      supabase
        .from('service_providers')
        .select('id, employee_id, display_label, sort_order, employee:employees!inner(id, name, is_active)')
        .eq('service_id', id)
        .order('sort_order'),
      supabase
        .from('service_locations')
        .select('location_id')
        .eq('service_id', id),
      supabase
        .from('service_required_forms')
        .select('form_id, sort_order')
        .eq('service_id', id)
        .order('sort_order'),
      supabase
        .from('service_automations')
        .select('action, config, is_active')
        .eq('service_id', id),
      supabase
        .from('service_prep_instructions')
        .select('sms_body, email_subject, email_body, send_hours_before, is_active')
        .eq('service_id', id)
        .maybeSingle(),
      supabase
        .from('service_addons')
        .select('addon_service_id, sort_order')
        .eq('service_id', id)
        .order('sort_order'),
    ]);

    return res.status(200).json({
      success: true,
      service,
      providers: (providers.data || []).map(p => ({
        employee_id: p.employee_id,
        employee_name: p.employee?.name || null,
        display_label: p.display_label,
        sort_order: p.sort_order,
        is_active: p.employee?.is_active !== false,
      })),
      location_ids: (locations.data || []).map(l => l.location_id),
      form_ids: (forms.data || []).map(f => f.form_id),
      automation_actions: (automations.data || []).filter(a => a.is_active !== false).map(a => a.action),
      addon_service_ids: (addons.data || []).map(a => a.addon_service_id),
      prep: prep.data || null,
    });
  } catch (e) {
    console.error('[admin/services] get error:', e);
    return res.status(500).json({ error: e.message });
  }
}

async function handlePatch(req, res, id, employee) {
  const {
    name, slug, category, group_label,
    duration_minutes, buffer_minutes,
    min_notice_hours, booking_window_days,
    description, has_modality, requires_blood_work, subtype, color,
    is_active, is_public_bookable, is_addon, sort_order,
    variants, price_cents,
    providers, location_ids, form_ids, automation_actions, addon_service_ids, prep,
  } = req.body || {};

  try {
    // Build basics payload only with fields that were actually provided.
    const updates = {};
    const setIfDefined = (key, value) => { if (value !== undefined) updates[key] = value; };
    setIfDefined('name', name);
    setIfDefined('slug', slug);
    setIfDefined('category', category);
    setIfDefined('group_label', group_label);
    setIfDefined('duration_minutes', duration_minutes);
    setIfDefined('buffer_minutes', buffer_minutes);
    setIfDefined('min_notice_hours', min_notice_hours);
    setIfDefined('booking_window_days', booking_window_days);
    setIfDefined('description', description);
    setIfDefined('has_modality', has_modality);
    setIfDefined('requires_blood_work', requires_blood_work);
    setIfDefined('subtype', subtype);
    setIfDefined('color', color);
    setIfDefined('is_active', is_active);
    setIfDefined('is_public_bookable', is_public_bookable);
    setIfDefined('is_addon', is_addon);
    setIfDefined('sort_order', sort_order);
    if (variants !== undefined) updates.variants = normalizeVariants(variants);
    if (price_cents !== undefined) {
      updates.price_cents = price_cents == null || price_cents === '' ? null : parseInt(price_cents, 10);
    }

    if (Object.keys(updates).length > 0) {
      const { error } = await supabase
        .from('services')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    }

    await writeRelations(id, { providers, location_ids, form_ids, automation_actions, addon_service_ids, prep });

    await logAction({
      employeeId: employee.id,
      employeeName: employee.name,
      action: 'update_service',
      resourceType: 'service',
      resourceId: id,
      details: {
        wrote_basics: Object.keys(updates),
        wrote_providers: providers !== undefined,
        wrote_locations: location_ids !== undefined,
        wrote_forms: form_ids !== undefined,
        wrote_automations: automation_actions !== undefined,
        wrote_addons: addon_service_ids !== undefined,
        wrote_prep: prep !== undefined,
      },
      req,
    });

    return res.status(200).json({ success: true });
  } catch (e) {
    console.error('[admin/services] patch error:', e);
    return res.status(500).json({ error: e.message });
  }
}

async function handleDelete(req, res, id, employee) {
  // Soft-delete: mark inactive instead of hard delete to preserve history
  // (existing appointments may reference the service via service_name).
  try {
    const { error } = await supabase
      .from('services')
      .update({ is_active: false })
      .eq('id', id);
    if (error) throw error;

    await logAction({
      employeeId: employee.id,
      employeeName: employee.name,
      action: 'deactivate_service',
      resourceType: 'service',
      resourceId: id,
      details: {},
      req,
    });

    return res.status(200).json({ success: true });
  } catch (e) {
    console.error('[admin/services] delete error:', e);
    return res.status(500).json({ error: e.message });
  }
}
