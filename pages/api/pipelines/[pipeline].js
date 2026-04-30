// /api/pipelines/[pipeline]
// GET  — list cards for a pipeline (active only by default)
// POST — create a new card on the pipeline

import { sb, createCard, findActiveCard } from '../../../lib/pipelines-server';
import { getPipeline, CARD_STATUS } from '../../../lib/pipelines-config';
import { HRT_PROGRAM_TYPES, WEIGHT_LOSS_PROGRAM_TYPES } from '../../../lib/protocol-config';

// pipeline → subscriptions.service_category (only where subscriptions exist)
const PIPELINE_TO_SUB_CATEGORY = { hrt: 'hrt', weight_loss: 'weight_loss' };
// pipelines that care about payment history (subs or one-time purchases)
const PAYMENT_PIPELINES = new Set(['hrt', 'weight_loss', 'peptides', 'hbot', 'rlt', 'injections']);
// Program types that signal a patient is already on an ongoing treatment plan —
// they don't belong on the Main Pipeline, which is for new workups.
const ACTIVE_TREATMENT_TYPES = [...HRT_PROGRAM_TYPES, ...WEIGHT_LOSS_PROGRAM_TYPES];

export default async function handler(req, res) {
  const { pipeline } = req.query;
  const def = getPipeline(pipeline);
  if (!def) return res.status(404).json({ error: 'Unknown pipeline' });

  if (req.method === 'GET') {
    const status = req.query.status || CARD_STATUS.ACTIVE;
    const { data, error } = await sb()
      .from('pipeline_cards')
      .select(`
        *,
        patient:patients(id, first_name, last_name, name, phone, email),
        protocol:protocols(
          id, supply_type, frequency, injection_frequency, injections_per_week,
          delivery_method, last_refill_date, next_expected_date, selected_dose,
          medication, start_date, end_date, total_sessions, sessions_used
        )
      `)
      .eq('pipeline', pipeline)
      .eq('status', status)
      .order('last_activity_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });

    let rows = (data || []).map(r => {
      const supply = r.protocol?.supply_type || null;
      const supply_category = supply
        ? (supply.startsWith('prefilled') ? 'prefilled' : supply.startsWith('vial') ? 'vial' : null)
        : null;
      return {
        ...r,
        patient_name: r.patient?.name
          || [r.patient?.first_name, r.patient?.last_name].filter(Boolean).join(' ')
          || null,
        // Fall back to the joined patient record when the card row has no denormalized copy
        phone: r.phone || r.patient?.phone || null,
        email: r.email || r.patient?.email || null,
        first_name: r.first_name || r.patient?.first_name || null,
        last_name:  r.last_name  || r.patient?.last_name  || null,
        patient: undefined,
        supply_category,
      };
    });

    // Labs pipelines split by treatment status:
    //   energy_workup → only patients NOT on active HRT/WL (new workup)
    //   follow_up_labs → only patients ON active HRT/WL (follow-up review)
    // Both also surface the latest lab draw date on each card.
    if (['energy_workup', 'follow_up_labs'].includes(pipeline) && rows.length > 0) {
      const client = sb();
      const patientIds = [...new Set(rows.map(r => r.patient_id).filter(Boolean))];

      if (patientIds.length) {
        const { data: activeTx } = await client
          .from('protocols')
          .select('patient_id')
          .in('patient_id', patientIds)
          .eq('status', 'active')
          .in('program_type', ACTIVE_TREATMENT_TYPES);
        const onTreatment = new Set((activeTx || []).map(p => p.patient_id));

        if (pipeline === 'energy_workup') {
          rows = rows.filter(r => !r.patient_id || !onTreatment.has(r.patient_id));
        } else if (pipeline === 'follow_up_labs') {
          rows = rows.filter(r => r.patient_id && onTreatment.has(r.patient_id));
        }

        const remainingIds = [...new Set(rows.map(r => r.patient_id).filter(Boolean))];
        if (remainingIds.length) {
          const { data: labs } = await client
            .from('lab_documents')
            .select('patient_id, collection_date, created_at')
            .in('patient_id', remainingIds)
            .order('created_at', { ascending: false });
          const drawnByPatient = {};
          for (const lab of labs || []) {
            if (!drawnByPatient[lab.patient_id]) {
              drawnByPatient[lab.patient_id] = lab.collection_date || lab.created_at;
            }
          }
          for (const r of rows) {
            if (r.patient_id && drawnByPatient[r.patient_id]) {
              r.labs_drawn_at = drawnByPatient[r.patient_id];
            }
          }
        }
      }
    }

    // HRT board prioritizes next pickup date so overdue/soonest float to the top.
    // Cards without a next_expected_date sort to the bottom, then by last_activity_at.
    if (pipeline === 'hrt' && rows.length > 0) {
      rows.sort((a, b) => {
        const aDate = a.protocol?.next_expected_date || null;
        const bDate = b.protocol?.next_expected_date || null;
        if (aDate && bDate) return aDate.localeCompare(bDate);
        if (aDate) return -1;
        if (bDate) return 1;
        return (b.last_activity_at || '').localeCompare(a.last_activity_at || '');
      });
    }

    // Enrich with payment data for treatment pipelines
    if (PAYMENT_PIPELINES.has(pipeline) && rows.length > 0) {
      const client = sb();
      const protocolIds = [...new Set(rows.map(r => r.protocol_id).filter(Boolean))];
      const patientIds  = [...new Set(rows.map(r => r.patient_id).filter(Boolean))];

      const purchasesByProto = {};
      if (protocolIds.length) {
        const { data: purchases } = await client
          .from('purchases')
          .select('protocol_id, purchase_date, amount_paid, stripe_status, created_at')
          .in('protocol_id', protocolIds)
          .order('purchase_date', { ascending: false, nullsFirst: false });
        for (const p of purchases || []) {
          if (!purchasesByProto[p.protocol_id]) purchasesByProto[p.protocol_id] = p;
        }
      }

      const subsByPatient = {};
      const subCat = PIPELINE_TO_SUB_CATEGORY[pipeline];
      if (subCat && patientIds.length) {
        const { data: subs } = await client
          .from('subscriptions')
          .select('patient_id, status, current_period_start, current_period_end, amount_cents, canceled_at')
          .in('patient_id', patientIds)
          .eq('service_category', subCat)
          .in('status', ['active', 'past_due', 'trialing', 'unpaid'])
          .order('created_at', { ascending: false });
        for (const s of subs || []) {
          if (!subsByPatient[s.patient_id]) subsByPatient[s.patient_id] = s;
        }
      }

      for (const r of rows) {
        const purchase = r.protocol_id ? purchasesByProto[r.protocol_id] : null;
        const sub = subsByPatient[r.patient_id];
        r.last_payment_date    = purchase?.purchase_date || (sub?.current_period_start ?? null);
        r.last_payment_cents   = purchase ? Math.round((purchase.amount_paid || 0) * 100) : (sub?.amount_cents ?? null);
        r.next_payment_date    = sub?.current_period_end || null;
        r.subscription_status  = sub?.status || null;
        r.payment_status       = sub?.status
          || (purchase?.stripe_status === 'succeeded' ? 'paid'
              : purchase?.stripe_status || (purchase ? 'paid' : null));
      }
    }

    return res.status(200).json(rows);
  }

  if (req.method === 'POST') {
    try {
      const body = req.body || {};
      // Block duplicate active cards for the same patient on this pipeline —
      // staff can manually close or complete the existing card first.
      if (body.patient_id) {
        const existing = await findActiveCard({ patient_id: body.patient_id, pipeline });
        if (existing) {
          return res.status(409).json({
            error: `Patient already has an active card on ${def.label}.`,
            existing,
          });
        }
      }
      const card = await createCard({
        pipeline,
        stage: body.stage,
        patient_id: body.patient_id,
        first_name: body.first_name, last_name: body.last_name,
        email: body.email, phone: body.phone,
        assigned_to: body.assigned_to,
        protocol_id: body.protocol_id,
        source: body.source, path: body.path, urgency: body.urgency,
        scheduled_for: body.scheduled_for,
        status: body.status,
        notes: body.notes,
        meta: body.meta || {},
        triggered_by: body.triggered_by || 'manual',
      });
      return res.status(201).json(card);
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).end();
}
