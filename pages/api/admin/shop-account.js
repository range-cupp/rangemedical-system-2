import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { requireAuth, logAction } from '../../../lib/auth';
import { Resend } from 'resend';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const resend = new Resend(process.env.RESEND_API_KEY);

function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let pw = '';
  for (let i = 0; i < 8; i++) pw += chars.charAt(Math.floor(Math.random() * chars.length));
  return pw;
}

function generateUsername(name) {
  const parts = name.toLowerCase().trim().split(/\s+/);
  const first = parts[0] || 'patient';
  const last = parts[parts.length - 1] || '';
  const rand = Math.floor(Math.random() * 900 + 100);
  return `${first}.${last}${rand}`;
}

export default async function handler(req, res) {
  const employee = await requireAuth(req, res);
  if (!employee) return;

  if (req.method === 'POST') {
    // Create or reset shop account for a patient
    const { patientId } = req.body;
    if (!patientId) return res.status(400).json({ error: 'Patient ID required' });

    const { data: patient } = await supabase
      .from('patients')
      .select('id, name, email, phone')
      .eq('id', patientId)
      .single();

    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    const plainPassword = generatePassword();
    const passwordHash = await bcrypt.hash(plainPassword, 10);

    // Check for existing account
    const { data: existing } = await supabase
      .from('shop_accounts')
      .select('id, username')
      .eq('patient_id', patientId)
      .single();

    let username;
    if (existing) {
      username = existing.username;
      await supabase
        .from('shop_accounts')
        .update({ password_hash: passwordHash, is_active: true })
        .eq('id', existing.id);
    } else {
      username = generateUsername(patient.name);
      // Ensure unique
      const { data: conflict } = await supabase.from('shop_accounts').select('id').eq('username', username).single();
      if (conflict) username += Math.floor(Math.random() * 90 + 10);

      await supabase
        .from('shop_accounts')
        .insert({ patient_id: patientId, username, password_hash: passwordHash });
    }

    const shopUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://rangemedical.com'}/shop`;

    // Send credentials via email if available
    if (patient.email) {
      try {
        await resend.emails.send({
          from: 'Range Medical <noreply@range-medical.com>',
          to: patient.email,
          subject: 'Your Range Medical Peptide Shop Access',
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; color: #1a1a1a;">
              <div style="border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 24px;">
                <h1 style="font-size: 18px; margin: 0; letter-spacing: 1px;">RANGE MEDICAL</h1>
              </div>
              <p style="font-size: 14px;">Hi ${patient.name.split(' ')[0]},</p>
              <p style="font-size: 14px;">Your peptide shop account is ready. Use the credentials below to log in and place orders:</p>
              <div style="background: #f8f8f8; padding: 20px; margin: 20px 0;">
                <p style="margin: 0 0 8px; font-size: 14px;"><strong>Shop URL:</strong> <a href="${shopUrl}" style="color: #171717;">${shopUrl}</a></p>
                <p style="margin: 0 0 8px; font-size: 14px;"><strong>Username:</strong> ${username}</p>
                <p style="margin: 0; font-size: 14px;"><strong>Password:</strong> ${plainPassword}</p>
              </div>
              <p style="font-size: 13px; color: #666;">Questions? Call or text (949) 997-3988</p>
            </div>
          `,
        });
      } catch (emailErr) {
        console.error('Shop credential email error:', emailErr);
      }
    }

    // Send via SMS if phone available
    if (patient.phone) {
      try {
        const { sendSMS } = require('../../../lib/send-sms');
        await sendSMS({
          to: patient.phone,
          message: `Range Medical Peptide Shop\n\nYour login:\nURL: ${shopUrl}\nUsername: ${username}\nPassword: ${plainPassword}\n\nQuestions? (949) 997-3988`,
          log: {
            messageType: 'shop_account_credentials',
            source: 'admin-shop-account',
            patientId: patientId,
          },
        });
      } catch (smsErr) {
        console.error('Shop credential SMS error:', smsErr);
      }
    }

    await logAction({
      employeeId: employee.id,
      employeeName: employee.name,
      action: 'create_shop_account',
      resourceType: 'patient',
      resourceId: patientId,
      details: { username, patientName: patient.name, sentEmail: !!patient.email, sentSMS: !!patient.phone },
      req,
    });

    return res.status(200).json({ success: true, username, password: plainPassword });
  }

  if (req.method === 'GET') {
    // Get shop account for a patient
    const { patientId } = req.query;
    if (!patientId) return res.status(400).json({ error: 'Patient ID required' });

    const { data: account } = await supabase
      .from('shop_accounts')
      .select('id, username, is_active, last_login_at, created_at')
      .eq('patient_id', patientId)
      .single();

    return res.status(200).json({ account: account || null });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
