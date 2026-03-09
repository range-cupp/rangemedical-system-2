// /pages/api/auth/logout.js
// Sign out endpoint
// Range Medical System

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
    // Extract token
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '').trim();

    if (token) {
      // Revoke the session server-side
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) {
        await supabase.auth.admin.signOut(token).catch(() => {});
      }
    }

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('Logout error:', error);
    return res.status(200).json({ success: true }); // Always succeed on logout
  }
}
