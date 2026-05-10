import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { firstName, email, phone, path, answers } = req.body;

    if (!firstName || !email || !path) {
      return res.status(400).json({ error: 'firstName, email, and path are required' });
    }

    const { data: existing } = await supabase
      .from('quiz_leads')
      .select('id, status')
      .eq('email', email.toLowerCase().trim())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing && existing.status === 'converted') {
      return res.status(200).json({ success: true, id: existing.id, alreadyConverted: true });
    }

    if (existing) {
      const { data: updated, error } = await supabase
        .from('quiz_leads')
        .update({
          first_name: firstName.trim(),
          phone: phone || null,
          path,
          answers: answers || {},
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select('id')
        .single();

      if (error) throw error;
      return res.status(200).json({ success: true, id: updated.id, updated: true });
    }

    const { data: lead, error } = await supabase
      .from('quiz_leads')
      .insert({
        first_name: firstName.trim(),
        email: email.toLowerCase().trim(),
        phone: phone || null,
        path,
        answers: answers || {},
      })
      .select('id')
      .single();

    if (error) throw error;

    return res.status(200).json({ success: true, id: lead.id });
  } catch (error) {
    console.error('Quiz submit error:', error);
    return res.status(500).json({ error: 'Failed to save lead' });
  }
}
