// Repair orphaned purchases — retroactively create/extend protocols for purchases
// that should have a protocol but don't (protocol_id IS NULL).
// POST /api/admin/repair-orphaned-purchases
// Optional body: { dry_run: true } to preview without making changes

import { createClient } from '@supabase/supabase-js';
import { autoCreateOrExtendProtocol } from '../../lib/auto-protocol';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Categories that should always have a linked protocol
const PROTOCOL_CATEGORIES = ['weight_loss', 'hrt', 'peptide'];

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const dryRun = req.body?.dry_run === true;
  const since = req.body?.since || '2025-12-01'; // Default: only recent purchases, not old GHL imports
  const patientId = req.body?.patient_id || null; // Optional: scope to a single patient
  const purchaseIds = Array.isArray(req.body?.purchase_ids) ? req.body.purchase_ids : null; // Optional: scope to specific purchases

  try {
    // Find all purchases that should have protocols but don't
    let query = supabase
      .from('purchases')
      .select('id, patient_id, purchase_date, medication, item_name, category, amount_paid, payment_method')
      .is('protocol_id', null)
      .in('category', PROTOCOL_CATEGORIES)
      .gte('purchase_date', since)
      .order('purchase_date', { ascending: true });

    if (patientId) query = query.eq('patient_id', patientId);
    if (purchaseIds && purchaseIds.length) query = query.in('id', purchaseIds);

    const { data: orphaned, error } = await query;

    if (error) return res.status(500).json({ error: error.message });

    if (!orphaned || orphaned.length === 0) {
      return res.status(200).json({ message: 'No orphaned purchases found', repaired: 0 });
    }

    if (dryRun) {
      return res.status(200).json({
        message: `Found ${orphaned.length} orphaned purchases (dry run — no changes made)`,
        orphaned: orphaned.map(p => ({
          id: p.id,
          patient_id: p.patient_id,
          date: p.purchase_date,
          item: p.medication || p.item_name,
          category: p.category,
          amount: p.amount_paid,
        })),
      });
    }

    const results = [];
    for (const purchase of orphaned) {
      // Build service_name from available fields
      const serviceName = purchase.item_name || purchase.medication || 'Unknown';
      const serviceCategory = purchase.category;

      try {
        await autoCreateOrExtendProtocol({
          patientId: purchase.patient_id,
          serviceCategory,
          serviceName,
          purchaseId: purchase.id,
          deliveryMethod: null,
          durationDays: null,
          quantity: 1,
          fulfillmentMethod: null,
          trackingNumber: null,
        });

        // Check if it got linked
        const { data: updated } = await supabase
          .from('purchases')
          .select('protocol_id')
          .eq('id', purchase.id)
          .single();

        results.push({
          id: purchase.id,
          item: purchase.medication || purchase.item_name,
          patient_id: purchase.patient_id,
          linked: !!updated?.protocol_id,
          protocol_id: updated?.protocol_id || null,
        });
      } catch (err) {
        results.push({
          id: purchase.id,
          item: purchase.medication || purchase.item_name,
          patient_id: purchase.patient_id,
          linked: false,
          error: err.message,
        });
      }
    }

    const repaired = results.filter(r => r.linked).length;
    const failed = results.filter(r => !r.linked).length;

    return res.status(200).json({
      message: `Repaired ${repaired} of ${orphaned.length} orphaned purchases (${failed} failed)`,
      repaired,
      failed,
      results,
    });
  } catch (err) {
    console.error('Repair orphaned purchases error:', err);
    return res.status(500).json({ error: err.message });
  }
}
