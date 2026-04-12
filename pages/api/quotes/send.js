// /pages/api/quotes/send.js
// Send a quote link via SMS to the recipient
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { sendSMS, normalizePhone } from '../../../lib/send-sms';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BASE_URL = 'https://range-medical.com';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { quote_id } = req.body || {};
    if (!quote_id) return res.status(400).json({ error: 'quote_id required' });

    const { data: quote, error } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', quote_id)
      .single();
    if (error || !quote) return res.status(404).json({ error: 'Quote not found' });

    if (!quote.recipient_phone) {
      return res.status(400).json({ error: 'No phone number on quote' });
    }

    const url = `${BASE_URL}/quote/${quote.token}`;
    const firstName = (quote.recipient_name || '').split(' ')[0] || 'there';
    const message = `Hi ${firstName} — here's the pricing we put together for you at Range Medical:\n\n${url}\n\nText this number with any questions.`;

    const result = await sendSMS({
      to: normalizePhone(quote.recipient_phone),
      message,
      log: {
        messageType: 'quote_sent',
        source: 'quotes-send',
      },
    });
    if (!result.success) return res.status(500).json({ error: result.error || 'SMS failed' });

    await supabase
      .from('quotes')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('id', quote.id);

    return res.status(200).json({ ok: true, url });
  } catch (err) {
    console.error('quotes send error', err);
    return res.status(500).json({ error: err.message });
  }
}
