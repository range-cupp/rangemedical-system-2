import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const JWT_SECRET = process.env.SHOP_JWT_SECRET || process.env.CRON_SECRET;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

  const { data: account, error } = await supabase
    .from('shop_accounts')
    .select('id, patient_id, username, password_hash, is_active')
    .eq('username', username.toLowerCase().trim())
    .single();

  if (error || !account) return res.status(401).json({ error: 'Invalid credentials' });
  if (!account.is_active) return res.status(401).json({ error: 'Account is inactive' });

  const valid = await bcrypt.compare(password, account.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  // Get patient info
  const { data: patient } = await supabase
    .from('patients')
    .select('id, name, email, phone')
    .eq('id', account.patient_id)
    .single();

  // Update last login
  await supabase
    .from('shop_accounts')
    .update({ last_login_at: new Date().toISOString() })
    .eq('id', account.id);

  const token = jwt.sign(
    { accountId: account.id, patientId: account.patient_id, username: account.username },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.status(200).json({
    token,
    patient: {
      id: patient.id,
      name: patient.name,
      email: patient.email,
      phone: patient.phone,
    },
  });
  } catch (err) {
    console.error('Shop auth error:', err);
    res.status(500).json({ error: err.message || 'Login failed' });
  }
}
