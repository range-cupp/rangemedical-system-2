import { createClient } from '@supabase/supabase-js';
import stripe from '../../../lib/stripe';
import { todayPacific } from '../../../lib/date-utils';
import { postToStaffChannel } from '../../../lib/post-to-staff-channel';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const MOTHERS_DAY_SEND_TIME = '2026-05-10T14:00:00.000Z';

function generateCode() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let s1 = '', s2 = '';
  for (let i = 0; i < 4; i++) {
    s1 += chars[Math.floor(Math.random() * chars.length)];
    s2 += chars[Math.floor(Math.random() * chars.length)];
  }
  return `RM-${s1}-${s2}`;
}

async function createUniqueCode() {
  for (let i = 0; i < 5; i++) {
    const code = generateCode();
    const { data: existing } = await supabase
      .from('gift_cards')
      .select('id')
      .eq('code', code)
      .maybeSingle();
    if (!existing) return code;
  }
  throw new Error('Could not generate unique gift card code');
}

async function sendEmail(payload) {
  if (!RESEND_API_KEY) return null;
  try {
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    const result = await resp.json();
    if (!resp.ok) console.error('Email failed:', result);
    return result;
  } catch (err) {
    console.error('Email error:', err.message);
    return null;
  }
}

function confirmationEmailHtml({ purchaserName, qty, totalPaid, totalCredit, codes, isGift, recipientName, sendType }) {
  const codeList = codes.map(c => `<span style="display:inline-block;background:#f5f5f5;padding:8px 16px;font-family:monospace;font-size:18px;font-weight:700;letter-spacing:2px;border:1px solid #e0e0e0;margin:4px 0;">${c}</span>`).join('<br/>');

  const giftInfo = isGift ? `
    <tr>
      <td style="padding:12px 16px;font-size:14px;color:#666;border-bottom:1px solid #f0f0f0;">Gift Recipient</td>
      <td style="padding:12px 16px;font-size:14px;color:#111;font-weight:600;text-align:right;border-bottom:1px solid #f0f0f0;">${recipientName}</td>
    </tr>
    <tr>
      <td style="padding:12px 16px;font-size:14px;color:#666;border-bottom:1px solid #f0f0f0;">Delivery</td>
      <td style="padding:12px 16px;font-size:14px;color:#111;font-weight:600;text-align:right;border-bottom:1px solid #f0f0f0;">${sendType === 'scheduled' ? 'Mother\'s Day morning (May 10)' : 'Sent immediately'}</td>
    </tr>` : '';

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
        <tr><td style="background:#000;padding:24px;text-align:center;">
          <h1 style="margin:0;color:#fff;font-size:18px;font-weight:700;letter-spacing:3px;">RANGE MEDICAL</h1>
        </td></tr>
        <tr><td style="padding:32px 28px;">
          <h2 style="margin:0 0 8px;font-size:22px;color:#111;font-weight:800;">Thank You, ${purchaserName}!</h2>
          <p style="margin:0 0 24px;font-size:15px;color:#666;line-height:1.6;">Your Mother's Day Wellness Credit order is confirmed.</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e0e0e0;margin-bottom:24px;">
            <tr style="background:#fafafa;">
              <td colspan="2" style="padding:12px 16px;font-size:11px;font-weight:700;letter-spacing:2px;color:#999;text-transform:uppercase;border-bottom:1px solid #e0e0e0;">Order Summary</td>
            </tr>
            <tr>
              <td style="padding:12px 16px;font-size:14px;color:#666;border-bottom:1px solid #f0f0f0;">Wellness Credit</td>
              <td style="padding:12px 16px;font-size:14px;color:#111;font-weight:600;text-align:right;border-bottom:1px solid #f0f0f0;">${qty} &times; $400</td>
            </tr>
            <tr>
              <td style="padding:12px 16px;font-size:14px;color:#666;border-bottom:1px solid #f0f0f0;">Amount Paid</td>
              <td style="padding:12px 16px;font-size:14px;color:#111;font-weight:600;text-align:right;border-bottom:1px solid #f0f0f0;">$${totalPaid}</td>
            </tr>${giftInfo}
          </table>
          <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:2px;color:#999;text-transform:uppercase;">Your Code${codes.length > 1 ? 's' : ''}</p>
          <div style="margin:0 0 24px;text-align:center;">${codeList}</div>
          <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:2px;color:#999;text-transform:uppercase;">How to Use</p>
          <ul style="margin:0 0 24px;padding-left:18px;font-size:14px;color:#444;line-height:1.8;">
            <li>Present your code at any Range Medical visit</li>
            <li>Good for any service &mdash; IVs, labs, red light, hyperbaric, hormones, weight loss, and more</li>
            <li>Use across multiple visits until your balance reaches $0</li>
          </ul>
          <p style="margin:0;font-size:14px;color:#444;line-height:1.6;">Questions? Call or text <a href="tel:+19499973988" style="color:#111;font-weight:600;text-decoration:none;">(949) 997-3988</a></p>
        </td></tr>
        <tr><td style="padding:16px 28px 24px;border-top:1px solid #eee;text-align:center;">
          <p style="margin:0 0 4px;font-size:13px;color:#111;font-weight:600;">Range Medical</p>
          <p style="margin:0;font-size:12px;color:#999;">1901 Westcliff Dr, Suite 10, Newport Beach, CA 92660</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function giftCardEmailHtml({ purchaserName, recipientName, code, expiresAt }) {
  const expDate = new Date(expiresAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
        <tr><td style="background:#000;padding:24px;text-align:center;">
          <h1 style="margin:0;color:#fff;font-size:18px;font-weight:700;letter-spacing:3px;">RANGE MEDICAL</h1>
        </td></tr>
        <tr><td style="padding:32px 28px;">
          <h2 style="margin:0 0 8px;font-size:22px;color:#111;font-weight:800;">Happy Mother's Day!</h2>
          <p style="margin:0 0 24px;font-size:15px;color:#666;line-height:1.6;">Someone special wants you to feel your best.</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border-radius:8px;overflow:hidden;margin:0 0 24px;">
            <tr><td style="padding:32px;text-align:center;">
              <p style="margin:0 0 4px;font-size:11px;color:#808080;letter-spacing:2px;text-transform:uppercase;">Mother's Day</p>
              <h2 style="margin:0 0 16px;font-size:24px;color:#fff;font-weight:900;letter-spacing:1px;">WELLNESS CREDIT</h2>
              <p style="margin:0 0 20px;font-size:42px;color:#fff;font-weight:900;">$400</p>
              <table width="80%" cellpadding="0" cellspacing="0" align="center">
                <tr>
                  <td style="padding:6px 0;font-size:13px;color:#808080;">To</td>
                  <td style="padding:6px 0;font-size:13px;color:#fff;text-align:right;font-weight:600;">${recipientName}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;font-size:13px;color:#808080;">From</td>
                  <td style="padding:6px 0;font-size:13px;color:#fff;text-align:right;font-weight:600;">${purchaserName}</td>
                </tr>
              </table>
              <div style="margin:20px auto;padding:14px 20px;background:rgba(255,255,255,0.08);border-radius:4px;display:inline-block;">
                <p style="margin:0 0 4px;font-size:10px;color:#808080;letter-spacing:1px;text-transform:uppercase;">Your Code</p>
                <p style="margin:0;font-size:22px;color:#fff;font-weight:700;letter-spacing:3px;font-family:monospace;">${code}</p>
              </div>
              <p style="margin:12px 0 0;font-size:12px;color:#606060;">Valid through ${expDate}</p>
            </td></tr>
          </table>
          <p style="margin:0 0 16px;font-size:15px;color:#444;line-height:1.6;">Your $400 wellness credit is good for any Range Medical service &mdash; IV therapy, red light therapy, hyperbaric oxygen, labs, peptides, hormone therapy, weight loss, and more.</p>
          <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:2px;color:#999;text-transform:uppercase;">How to Use</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr><td style="padding:10px 0;font-size:14px;color:#444;line-height:1.6;border-bottom:1px solid #f0f0f0;">
              <span style="display:inline-block;width:24px;height:24px;background:#1a1a1a;color:#808080;font-size:12px;font-weight:700;text-align:center;line-height:24px;margin-right:10px;vertical-align:middle;">1</span>
              Call or text <strong>(949) 997-3988</strong> to schedule
            </td></tr>
            <tr><td style="padding:10px 0;font-size:14px;color:#444;line-height:1.6;border-bottom:1px solid #f0f0f0;">
              <span style="display:inline-block;width:24px;height:24px;background:#1a1a1a;color:#808080;font-size:12px;font-weight:700;text-align:center;line-height:24px;margin-right:10px;vertical-align:middle;">2</span>
              Mention your gift code when you arrive
            </td></tr>
            <tr><td style="padding:10px 0;font-size:14px;color:#444;line-height:1.6;">
              <span style="display:inline-block;width:24px;height:24px;background:#1a1a1a;color:#808080;font-size:12px;font-weight:700;text-align:center;line-height:24px;margin-right:10px;vertical-align:middle;">3</span>
              Your credit is applied automatically
            </td></tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center">
              <a href="tel:+19499973988" style="display:inline-block;background:#000;color:#fff;padding:14px 40px;font-size:14px;font-weight:700;text-decoration:none;letter-spacing:1px;">SCHEDULE YOUR FIRST VISIT</a>
            </td></tr>
          </table>
          <p style="margin:24px 0 0;font-size:14px;color:#666;line-height:1.6;text-align:center;">We can't wait to take care of you.</p>
        </td></tr>
        <tr><td style="padding:16px 28px 24px;border-top:1px solid #eee;text-align:center;">
          <p style="margin:0 0 4px;font-size:13px;color:#111;font-weight:600;">Range Medical</p>
          <p style="margin:0 0 4px;font-size:12px;color:#999;">1901 Westcliff Dr, Suite 10, Newport Beach, CA 92660</p>
          <p style="margin:0;font-size:11px;color:#bbb;">Credit valid 12 months from purchase. Non-refundable.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    patient_id,
    payment_method_id,
    quantity,
    is_gift,
    recipient_name,
    recipient_email,
    send_type,
  } = req.body;

  if (!patient_id || !payment_method_id) {
    return res.status(400).json({ error: 'patient_id and payment_method_id are required.' });
  }

  const qty = Math.min(Math.max(parseInt(quantity) || 1, 1), 2);
  const isGift = is_gift === true || is_gift === 'true';

  if (isGift && (!recipient_name || !recipient_email)) {
    return res.status(400).json({ error: 'Recipient name and email are required for gifts.' });
  }

  try {
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('id, name, first_name, email, phone, stripe_customer_id')
      .eq('id', patient_id)
      .single();

    if (patientError || !patient) {
      return res.status(404).json({ error: 'Patient not found.' });
    }

    if (!patient.stripe_customer_id) {
      return res.status(400).json({ error: 'Patient has no Stripe customer on file.' });
    }

    const normalizedEmail = (patient.email || '').toLowerCase().trim();

    const { data: existingPromos } = await supabase
      .from('mothers_day_promos')
      .select('id')
      .eq('purchaser_email', normalizedEmail);

    const existingCount = (existingPromos || []).length;
    if (existingCount + qty > 2) {
      const remaining = Math.max(0, 2 - existingCount);
      return res.status(400).json({
        error: remaining === 0
          ? `${patient.name} has already purchased the maximum of 2 Wellness Credits.`
          : `${patient.name} can only purchase ${remaining} more (max 2 per person).`,
      });
    }

    const totalCents = qty * 30000;
    const totalPaidDollars = qty * 300;
    const totalCreditDollars = qty * 400;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalCents,
      currency: 'usd',
      customer: patient.stripe_customer_id,
      payment_method: payment_method_id,
      payment_method_types: ['card'],
      confirm: true,
      description: `Mother's Day Wellness Credit — ${patient.name}`,
      metadata: {
        patient_id: patient.id,
        type: 'mothers_day_wellness_credit',
      },
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://app.range-medical.com'}/admin/patient/${patient.id}`,
    });

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ error: `Payment not completed. Status: ${paymentIntent.status}` });
    }

    let cardBrand = null;
    let cardLast4 = null;
    if (paymentIntent.payment_method) {
      try {
        const pm = await stripe.paymentMethods.retrieve(paymentIntent.payment_method);
        if (pm.card) {
          cardBrand = pm.card.brand;
          cardLast4 = pm.card.last4;
        }
      } catch (e) {}
    }

    await supabase
      .from('purchases')
      .insert({
        patient_id: patient.id,
        patient_name: patient.name,
        patient_email: normalizedEmail,
        patient_phone: patient.phone || null,
        item_name: "Mother's Day Wellness Credit",
        product_name: "Mother's Day Wellness Credit",
        amount: totalPaidDollars,
        amount_paid: totalPaidDollars,
        category: 'gift_card',
        quantity: qty,
        stripe_payment_intent_id: paymentIntent.id,
        stripe_amount_cents: totalCents,
        stripe_status: 'succeeded',
        stripe_verified_at: new Date().toISOString(),
        payment_method: 'stripe',
        source: 'admin_checkout',
        purchase_date: todayPacific(),
        card_brand: cardBrand,
        card_last4: cardLast4,
      });

    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    const cards = [];
    const promos = [];

    for (let i = 0; i < qty; i++) {
      const code = await createUniqueCode();

      const { data: card, error: cardError } = await supabase
        .from('gift_cards')
        .insert({
          code,
          initial_amount: 40000,
          remaining_amount: 40000,
          status: 'active',
          buyer_name: patient.name,
          notes: `Mother's Day 2026 promo — paid $300, credit $400. Expires ${expiresAt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.${isGift ? ` Gift for ${recipient_name}.` : ''}`
        })
        .select()
        .single();

      if (cardError) throw cardError;
      cards.push(card);

      const recipEmail = isGift ? recipient_email.toLowerCase().trim() : normalizedEmail;

      const { data: promo, error: promoError } = await supabase
        .from('mothers_day_promos')
        .insert({
          gift_card_id: card.id,
          purchaser_name: patient.name,
          purchaser_email: normalizedEmail,
          purchaser_phone: patient.phone || null,
          is_gift: isGift,
          recipient_name: isGift ? recipient_name : patient.name,
          recipient_email: recipEmail,
          amount_paid: 30000,
          credit_value: 40000,
          send_type: isGift ? (send_type || 'now') : 'now',
          scheduled_send_at: (isGift && send_type === 'scheduled') ? MOTHERS_DAY_SEND_TIME : null,
          gift_sent: !isGift,
          expires_at: expiresAt.toISOString()
        })
        .select()
        .single();

      if (promoError) throw promoError;
      promos.push(promo);
    }

    const codes = cards.map(c => c.code);

    await sendEmail({
      from: 'Range Medical <noreply@range-medical.com>',
      to: normalizedEmail,
      subject: "Your Mother's Day Wellness Credit — Range Medical",
      html: confirmationEmailHtml({
        purchaserName: patient.name,
        qty,
        totalPaid: totalPaidDollars,
        totalCredit: totalCreditDollars,
        codes,
        isGift,
        recipientName: recipient_name,
        sendType: send_type
      })
    });

    if (isGift && send_type !== 'scheduled') {
      for (let i = 0; i < cards.length; i++) {
        await sendEmail({
          from: 'Range Medical <noreply@range-medical.com>',
          to: recipient_email.toLowerCase().trim(),
          subject: `You've Received a Mother's Day Wellness Gift from ${patient.name}`,
          html: giftCardEmailHtml({
            purchaserName: patient.name,
            recipientName: recipient_name,
            code: cards[i].code,
            expiresAt: expiresAt.toISOString()
          })
        });

        await supabase
          .from('mothers_day_promos')
          .update({ gift_sent: true, gift_sent_at: new Date().toISOString() })
          .eq('id', promos[i].id);
      }
    }

    postToStaffChannel({
      channelName: 'Sales Alerts',
      memberEmails: ['damon@range-medical.com', 'tara@range-medical.com'],
      content: [
        `Mother's Day Wellness Credit — $${totalPaidDollars}`,
        '',
        patient.name,
        normalizedEmail,
        patient.phone || '',
        '',
        `${qty}x credit ($${totalCreditDollars} value)`,
        isGift ? `Gift for ${recipient_name} (${recipient_email})` : 'Self-purchase',
        isGift && send_type === 'scheduled' ? 'Delivery: Mother\'s Day morning' : '',
        'Processed by staff via admin checkout',
      ].filter(Boolean).join('\n'),
    }).catch(err => console.error("Mother's Day staff alert error:", err));

    return res.status(201).json({
      success: true,
      quantity: qty,
      total_paid: totalPaidDollars,
      total_credit: totalCreditDollars,
      codes,
      is_gift: isGift,
      recipient_name: isGift ? recipient_name : null,
      send_type: isGift ? (send_type || 'now') : 'now',
      payment_intent_id: paymentIntent.id,
    });

  } catch (error) {
    console.error("Mother's Day admin purchase error:", error);
    if (error.type === 'StripeCardError') {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: error.message });
  }
}
