// /pages/api/cron/daily-numbers-sms.js
// Sends daily end-of-day numbers as SMS — same data as daily-sales-report email
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { sendSMS, normalizePhone } from '../../../lib/send-sms';
import { logComm } from '../../../lib/comms-log';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Default SMS recipients — can be overridden via ?to= query param
const DEFAULT_RECIPIENTS = [
  '+19496900339',
];

const CATEGORY_LABELS = {
  hrt: 'HRT',
  weight_loss: 'Weight Loss',
  peptide: 'Peptides',
  iv_therapy: 'IV Therapy',
  iv: 'IV Therapy',
  hbot: 'HBOT',
  red_light: 'Red Light',
  rlt: 'Red Light',
  injection: 'Injections',
  testosterone: 'Testosterone',
  vitamin: 'Vitamins',
  other: 'Other',
};

function catLabel(cat) {
  return CATEGORY_LABELS[cat] || cat.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function fmtMoney(n) {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default async function handler(req, res) {
  // Verify cron authorization
  const cronSecret = req.headers['x-cron-secret'] || req.query.secret;
  const authHeader = req.headers['authorization'];
  const isVercelCron = !!req.headers['x-vercel-cron-signature'];
  const isAuthorized = isVercelCron || (
    process.env.CRON_SECRET && (
      cronSecret === process.env.CRON_SECRET ||
      authHeader === `Bearer ${process.env.CRON_SECRET}`
    )
  );

  if (!isAuthorized) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const now = new Date();
    const pacificDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
    const today = pacificDate.toISOString().split('T')[0];
    const shortDate = pacificDate.toLocaleDateString('en-US', {
      month: 'numeric', day: 'numeric', year: '2-digit',
    });

    console.log(`Daily Numbers SMS — fetching data for ${today}`);

    // ── 1. Revenue: today's purchases ──────────────────────────────────
    const { data: purchases, error: purchaseErr } = await supabase
      .from('purchases')
      .select('id, amount, amount_paid, category, payment_method')
      .eq('purchase_date', today)
      .neq('dismissed', true);

    if (purchaseErr) throw purchaseErr;

    const totalRevenue = (purchases || []).reduce((sum, p) => {
      return sum + (parseFloat(p.amount_paid) || parseFloat(p.amount) || 0);
    }, 0);

    const transactionCount = (purchases || []).length;

    // Revenue by category
    const revenueByCategory = {};
    (purchases || []).forEach(p => {
      const cat = p.category || 'other';
      if (!revenueByCategory[cat]) revenueByCategory[cat] = { count: 0, total: 0 };
      revenueByCategory[cat].count++;
      revenueByCategory[cat].total += parseFloat(p.amount_paid) || parseFloat(p.amount) || 0;
    });

    // ── 2. Sessions: today's service log entries ───────────────────────
    const { data: sessions, error: sessionErr } = await supabase
      .from('service_logs')
      .select('id, patient_id, category')
      .eq('entry_date', today);

    if (sessionErr) throw sessionErr;

    const sessionCount = (sessions || []).length;

    const sessionsByCategory = {};
    (sessions || []).forEach(s => {
      const cat = s.category || 'other';
      if (!sessionsByCategory[cat]) sessionsByCategory[cat] = 0;
      sessionsByCategory[cat]++;
    });

    // ── 3. Patients: new vs returning ──────────────────────────────────
    const { count: newPatientCount, error: newPatErr } = await supabase
      .from('patients')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', `${today}T00:00:00`)
      .lt('created_at', `${today}T23:59:59.999`);

    if (newPatErr) throw newPatErr;

    const { data: newPatientIds } = await supabase
      .from('patients')
      .select('id')
      .gte('created_at', `${today}T00:00:00`)
      .lt('created_at', `${today}T23:59:59.999`);

    const newIdSet = new Set((newPatientIds || []).map(p => p.id));
    const todaySessionPatientIds = [...new Set((sessions || []).map(s => s.patient_id).filter(Boolean))];
    const returningPatientCount = todaySessionPatientIds.filter(id => !newIdSet.has(id)).length;

    // ── 4. Build SMS message ───────────────────────────────────────────
    let msg = `Range Medical EOD ${shortDate}\n`;
    msg += `\n`;
    msg += `Revenue: ${fmtMoney(totalRevenue)} (${transactionCount} txns)\n`;
    msg += `Sessions: ${sessionCount}\n`;
    msg += `New Patients: ${newPatientCount || 0}\n`;
    msg += `Returning: ${returningPatientCount}\n`;

    // Category breakdown (revenue)
    const sortedCats = Object.entries(revenueByCategory).sort((a, b) => b[1].total - a[1].total);
    if (sortedCats.length > 0) {
      msg += `\nRevenue Breakdown:\n`;
      sortedCats.forEach(([cat, data]) => {
        msg += `  ${catLabel(cat)}: ${fmtMoney(data.total)} (${data.count})\n`;
      });
    }

    // Session breakdown
    const sortedSessionCats = Object.entries(sessionsByCategory).sort((a, b) => b[1] - a[1]);
    if (sortedSessionCats.length > 0) {
      msg += `\nSessions Breakdown:\n`;
      sortedSessionCats.forEach(([cat, count]) => {
        msg += `  ${catLabel(cat)}: ${count}\n`;
      });
    }

    // ── 5. Send SMS ────────────────────────────────────────────────────
    // Allow override via query param, otherwise use defaults
    const recipientParam = req.query.to;
    const recipients = recipientParam
      ? recipientParam.split(',').map(n => normalizePhone(n.trim()))
      : DEFAULT_RECIPIENTS;

    const results = [];
    for (const phone of recipients) {
      const smsResult = await sendSMS({ to: phone, message: msg });
      results.push({ phone, ...smsResult });

      await logComm({
        channel: 'sms',
        messageType: 'daily_numbers_sms',
        message: `EOD numbers: ${fmtMoney(totalRevenue)} revenue, ${sessionCount} sessions`,
        source: 'cron/daily-numbers-sms',
        recipient: phone,
        subject: `Daily Numbers ${shortDate}`,
        status: smsResult.success ? 'sent' : 'error',
        errorMessage: smsResult.error || null,
      });
    }

    const allSent = results.every(r => r.success);
    console.log(`Daily Numbers SMS — ${allSent ? 'all sent' : 'some failures'}`, results);

    return res.status(200).json({
      success: allSent,
      date: today,
      totalRevenue,
      transactionCount,
      sessionCount,
      newPatientCount: newPatientCount || 0,
      returningPatientCount,
      results,
    });
  } catch (error) {
    console.error('Daily Numbers SMS error:', error);
    return res.status(500).json({ error: error.message });
  }
}
