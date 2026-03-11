// /pages/api/staff-bot/chat.js
// Staff bot chat API — accepts a message from an authenticated employee
// and returns a natural language response from the staff bot.
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { handleStaffMessage } from '../../../lib/staff-bot';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Authenticate via Supabase JWT
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '').trim();

    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    // Look up employee record
    const { data: employee } = await supabase
      .from('employees')
      .select('id, name, title, is_admin, phone, calcom_user_id, permissions')
      .eq('email', user.email)
      .eq('is_active', true)
      .maybeSingle();

    if (!employee) {
      return res.status(403).json({ error: 'No active employee account found' });
    }

    // Get message from request body
    const { message } = req.body;
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Run through staff bot
    const response = await handleStaffMessage(message.trim(), employee);

    return res.status(200).json({ response, employee: { name: employee.name, title: employee.title } });

  } catch (error) {
    console.error('Staff bot chat error:', error);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}
