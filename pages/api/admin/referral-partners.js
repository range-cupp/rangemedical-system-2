import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // GET — load all partners + leads
  if (req.method === 'GET') {
    try {
      const [partnersRes, leadsRes] = await Promise.all([
        supabase.from('referral_partners').select('*').order('created_at', { ascending: true }),
        supabase.from('referral_leads').select('*').order('created_at', { ascending: false }),
      ]);

      return res.status(200).json({
        partners: partnersRes.data || [],
        leads: leadsRes.data || [],
      });
    } catch (err) {
      console.error('Referral partners GET error:', err);
      return res.status(500).json({ error: 'Failed to load data' });
    }
  }

  // POST — create new partner
  if (req.method === 'POST') {
    const { slug, name, partner_type, assigned_to, headline, subheadline } = req.body;
    if (!slug || !name) {
      return res.status(400).json({ error: 'slug and name are required' });
    }

    const { error } = await supabase.from('referral_partners').insert({
      slug,
      name,
      partner_type: partner_type || null,
      assigned_to: assigned_to || null,
      headline: headline || `${name} sent you here for a reason.`,
      subheadline: subheadline || "Here's what we actually do for people who want to perform at a higher level.",
      active: true,
    });

    if (error) {
      console.error('Create partner error:', error);
      if (error.code === '23505') {
        return res.status(409).json({ error: 'A partner with that slug already exists' });
      }
      return res.status(500).json({ error: 'Failed to create partner' });
    }

    return res.status(200).json({ success: true });
  }

  // PATCH — update partner fields (active, assigned_to)
  if (req.method === 'PATCH') {
    const { id, active, assigned_to } = req.body;
    if (!id) return res.status(400).json({ error: 'id is required' });

    const updates = {};
    if (typeof active === 'boolean') updates.active = active;
    if (typeof assigned_to === 'string') updates.assigned_to = assigned_to;

    const { error } = await supabase
      .from('referral_partners')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('Toggle partner error:', error);
      return res.status(500).json({ error: 'Failed to update partner' });
    }

    return res.status(200).json({ success: true });
  }

  // PUT — update lead status
  if (req.method === 'PUT') {
    const { lead_id, status } = req.body;
    if (!lead_id || !status) return res.status(400).json({ error: 'lead_id and status are required' });

    const validStatuses = ['new', 'contacted', 'converted', 'not_interested'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const { error } = await supabase
      .from('referral_leads')
      .update({ status })
      .eq('id', lead_id);

    if (error) {
      console.error('Update lead status error:', error);
      return res.status(500).json({ error: 'Failed to update lead status' });
    }

    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
