// /pages/api/quotes/send-payment-link.js
// Send the Stripe Checkout URL to the patient via SMS.
// Body: { quote_id }
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { sendSMS, normalizePhone } from '../../../lib/send-sms';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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
    if (!quote.stripe_session_url) return res.status(400).json({ error: 'No payment link on this quote — create one first' });
    if (!quote.recipient_phone) return res.status(400).json({ error: 'No phone number on quote' });

    const firstName = (quote.recipient_name || '').split(' ')[0] || 'there';
    const message = `Hi ${firstName} — here's your secure payment link for Range Medical:\n\n${quote.stripe_session_url}\n\nReply with any questions.`;

    const result = await sendSMS({
      to: normalizePhone(quote.recipient_phone),
      message,
      log: {
        messageType: 'quote_payment_link',
        source: 'quotes-payment-link',
      },
    });
    if (!result.success) return res.status(500).json({ error: result.error || 'SMS failed' });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('quote send-payment-link error', err);
    return res.status(500).json({ error: err.message });
  }
}
