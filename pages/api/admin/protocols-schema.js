// /pages/api/admin/protocols-schema.js
// Analyze protocols table structure

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
    // Get sample protocols to see all fields
    const { data: protocols, error } = await supabase
      .from('protocols')
      .select('*')
      .limit(5);

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch protocols', details: error.message });
    }

    const fields = protocols?.[0] ? Object.keys(protocols[0]) : [];

    // Get counts by delivery method
    const { data: allProtocols } = await supabase
      .from('protocols')
      .select('delivery_method, status')
      .eq('status', 'active');

    const deliveryMethods = {};
    for (const p of allProtocols || []) {
      const dm = p.delivery_method || 'unknown';
      deliveryMethods[dm] = (deliveryMethods[dm] || 0) + 1;
    }

    // Get in-clinic protocols specifically
    const { data: inClinicProtocols } = await supabase
      .from('protocols')
      .select('*, patients(first_name, last_name, name, email)')
      .or('delivery_method.ilike.%clinic%,delivery_method.ilike.%in-clinic%,delivery_method.ilike.%in_clinic%')
      .eq('status', 'active')
      .limit(20);

    return res.status(200).json({
      fields,
      sample: protocols?.[0],
      delivery_method_counts: deliveryMethods,
      in_clinic_protocols: inClinicProtocols,
      in_clinic_count: inClinicProtocols?.length || 0
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
}
