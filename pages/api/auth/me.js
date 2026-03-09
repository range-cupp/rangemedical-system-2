// /pages/api/auth/me.js
// Returns the authenticated employee's profile
// Range Medical System

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
    // Extract token from Authorization header
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '').trim();

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify token with Supabase Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Look up employee record by email
    const { data: employee, error: empError } = await supabase
      .from('employees')
      .select('id, email, name, title, is_admin, permissions, calcom_user_id, is_active')
      .eq('email', user.email)
      .eq('is_active', true)
      .maybeSingle();

    if (empError) {
      console.error('Employee lookup error:', empError);
      return res.status(500).json({ error: 'Failed to look up employee' });
    }

    if (!employee) {
      return res.status(403).json({ error: 'No active employee account found for this email' });
    }

    return res.status(200).json({ employee });

  } catch (error) {
    console.error('Auth /me error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
