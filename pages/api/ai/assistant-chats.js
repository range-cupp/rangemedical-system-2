import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const { method } = req;

  if (method === 'GET') {
    const { user_email, id } = req.query;

    if (id) {
      const { data, error } = await supabase
        .from('assistant_chats')
        .select('*')
        .eq('id', id)
        .single();
      if (error) return res.status(404).json({ error: 'Chat not found' });
      return res.status(200).json({ chat: data });
    }

    if (!user_email) return res.status(400).json({ error: 'user_email required' });
    const { data, error } = await supabase
      .from('assistant_chats')
      .select('id, title, patient_name, created_at, updated_at')
      .eq('user_email', user_email)
      .order('updated_at', { ascending: false })
      .limit(50);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ chats: data || [] });
  }

  if (method === 'POST') {
    const { user_email, title, messages, patient_id, patient_name } = req.body;
    if (!user_email) return res.status(400).json({ error: 'user_email required' });

    const { data, error } = await supabase
      .from('assistant_chats')
      .insert({
        user_email,
        title: title || 'New Chat',
        messages: messages || [],
        patient_id: patient_id || null,
        patient_name: patient_name || null,
      })
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ chat: data });
  }

  if (method === 'PUT') {
    const { id, title, messages, patient_id, patient_name } = req.body;
    if (!id) return res.status(400).json({ error: 'id required' });

    const update = { updated_at: new Date().toISOString() };
    if (title !== undefined) update.title = title;
    if (messages !== undefined) update.messages = messages;
    if (patient_id !== undefined) update.patient_id = patient_id;
    if (patient_name !== undefined) update.patient_name = patient_name;

    const { data, error } = await supabase
      .from('assistant_chats')
      .update(update)
      .eq('id', id)
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ chat: data });
  }

  if (method === 'DELETE') {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'id required' });
    const { error } = await supabase.from('assistant_chats').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
