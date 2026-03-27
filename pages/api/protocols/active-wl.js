// GET /api/protocols/active-wl?patient_id=xxx
// Returns the active weight loss protocol with context for encounter modal
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const { patient_id } = req.query;
  if (!patient_id) return res.status(400).json({ error: 'patient_id required' });

  try {
    // Find active weight loss protocol
    const { data: protocol } = await supabase
      .from('protocols')
      .select('id, medication, selected_dose, sessions_used, total_sessions, starting_weight, delivery_method')
      .eq('patient_id', patient_id)
      .ilike('program_type', 'weight_loss%')
      .in('status', ['active', 'in_progress'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!protocol) return res.status(200).json({ protocol: null });

    // Get last two weights from service_logs for context
    const { data: recentWeights } = await supabase
      .from('service_logs')
      .select('weight, entry_date')
      .eq('protocol_id', protocol.id)
      .eq('category', 'weight_loss')
      .not('weight', 'is', null)
      .order('entry_date', { ascending: false })
      .limit(2);

    const lastWeight = recentWeights?.[0]?.weight ? parseFloat(recentWeights[0].weight) : null;
    const prevWeight = recentWeights?.[1]?.weight ? parseFloat(recentWeights[1].weight) : null;
    const weightChange = lastWeight && prevWeight ? Math.round((lastWeight - prevWeight) * 10) / 10 : null;

    return res.status(200).json({
      protocol: {
        ...protocol,
        last_weight: lastWeight,
        weight_change: weightChange,
      }
    });
  } catch (err) {
    console.error('active-wl error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
