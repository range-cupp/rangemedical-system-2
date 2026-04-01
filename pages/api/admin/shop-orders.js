import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '../../../lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const employee = await requireAuth(req, res);
  if (!employee) return;

  if (req.method === 'GET') {
    const { patientId, status } = req.query;

    let query = supabase
      .from('shop_orders')
      .select('*, patients(name, email, phone)')
      .order('created_at', { ascending: false })
      .limit(100);

    if (patientId) query = query.eq('patient_id', patientId);
    if (status) query = query.eq('status', status);

    const { data: orders, error } = await query;
    if (error) return res.status(500).json({ error: 'Failed to fetch orders' });

    return res.status(200).json({ orders });
  }

  if (req.method === 'PATCH') {
    // Update order status, tracking number
    const { orderId, status, trackingNumber } = req.body;
    if (!orderId) return res.status(400).json({ error: 'Order ID required' });

    const updates = {};
    if (status) updates.status = status;
    if (trackingNumber) {
      updates.tracking_number = trackingNumber;
      updates.shipped_at = new Date().toISOString();
    }

    const { data: order, error } = await supabase
      .from('shop_orders')
      .update(updates)
      .eq('id', orderId)
      .select()
      .single();

    if (error) return res.status(500).json({ error: 'Failed to update order' });

    return res.status(200).json({ order });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
