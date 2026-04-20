// Repair orphaned purchases — re-run autoCreateOrExtendProtocol for purchases
// that were recorded before the category mapping covered their service_category,
// or that failed for any other reason and never linked to a protocol.
//
// Usage:
//   GET /api/admin/repair-orphaned-purchases                  → dry run, all
//   GET /api/admin/repair-orphaned-purchases?apply=1          → apply, all
//   GET /api/admin/repair-orphaned-purchases?patient=<id>     → one patient
//   GET /api/admin/repair-orphaned-purchases?categories=injection,nad_injection
//
// Returns { dryRun, fixed: [...], skipped: [...], errors: [...] }

import { createClient } from '@supabase/supabase-js';
import { autoCreateOrExtendProtocol } from '../../../lib/auto-protocol';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const DEFAULT_INJECTION_CATEGORIES = [
  'injection', 'injections', 'injection_pack',
  'injection_standard', 'injection_premium', 'nad_injection',
  'Injection', // legacy case variant
];

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apply = req.query.apply === '1' || req.query.apply === 'true';
  const onlyPatient = req.query.patient || null;
  const categoriesParam = req.query.categories;
  const categories = categoriesParam
    ? categoriesParam.split(',').map(s => s.trim()).filter(Boolean)
    : DEFAULT_INJECTION_CATEGORIES;

  try {
    let query = supabase
      .from('purchases')
      .select('id, patient_id, patient_name, purchase_date, category, product_name, item_name, description, quantity, amount_paid, protocol_id, protocol_created')
      .in('category', categories)
      .is('protocol_id', null)
      .order('purchase_date', { ascending: true })
      .limit(1000);

    if (onlyPatient) query = query.eq('patient_id', onlyPatient);

    const { data: orphans, error } = await query;
    if (error) return res.status(500).json({ error: error.message });

    const fixed = [];
    const skipped = [];
    const errors = [];

    for (const p of orphans) {
      const name = p.product_name || p.item_name || p.description || '';
      const label = {
        id: p.id,
        date: p.purchase_date,
        patient: p.patient_name,
        category: p.category,
        quantity: p.quantity,
        name,
      };

      if (!p.patient_id) { skipped.push({ ...label, reason: 'no patient_id' }); continue; }
      if (!name.trim()) { skipped.push({ ...label, reason: 'no service name' }); continue; }

      if (!apply) { fixed.push({ ...label, wouldFix: true }); continue; }

      try {
        // Re-check protocol_id fresh — a prior iteration may have linked this.
        const { data: current } = await supabase.from('purchases')
          .select('protocol_id')
          .eq('id', p.id)
          .single();
        if (current?.protocol_id) { skipped.push({ ...label, reason: 'already linked' }); continue; }

        await autoCreateOrExtendProtocol({
          patientId: p.patient_id,
          serviceCategory: p.category,
          serviceName: name,
          purchaseId: p.id,
          quantity: p.quantity || 1,
          deliveryMethod: 'in_clinic',
        });

        const { data: after } = await supabase.from('purchases')
          .select('protocol_id, protocol_created')
          .eq('id', p.id)
          .single();

        if (after?.protocol_id) {
          fixed.push({ ...label, protocolId: after.protocol_id });
        } else if (after?.protocol_created) {
          fixed.push({ ...label, protocolId: null, note: 'protocol_created flag set without id (peptide sequential)' });
        } else {
          skipped.push({ ...label, reason: 'auto-protocol did not link' });
        }
      } catch (err) {
        errors.push({ ...label, error: err.message });
      }
    }

    return res.status(200).json({
      dryRun: !apply,
      categories,
      onlyPatient,
      totalOrphans: orphans.length,
      fixedCount: fixed.length,
      skippedCount: skipped.length,
      errorCount: errors.length,
      fixed,
      skipped,
      errors,
    });
  } catch (err) {
    console.error('Repair orphaned purchases error:', err);
    return res.status(500).json({ error: err.message });
  }
}
