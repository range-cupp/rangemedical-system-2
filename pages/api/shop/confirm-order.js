import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import jwt from 'jsonwebtoken';
import { Resend } from 'resend';
import { getVialById, getShippingOption } from '../../../lib/vial-catalog';
import { todayPacific } from '../../../lib/date-utils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const resend = new Resend(process.env.RESEND_API_KEY);
const JWT_SECRET = process.env.SHOP_JWT_SECRET || process.env.CRON_SECRET;

function verifyToken(req) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return null;
  try {
    return jwt.verify(auth.split(' ')[1], JWT_SECRET);
  } catch {
    return null;
  }
}

function generateOrderNumber() {
  const date = new Date();
  const y = date.getFullYear().toString().slice(-2);
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `RM-${y}${m}${d}-${rand}`;
}

function buildReceiptEmail(patient, order, items) {
  const itemRows = items.map(item => {
    const vial = getVialById(item.peptide_id);
    return `
      <tr>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e5e5e5; font-size: 14px;">
          <strong>${item.name}</strong>${vial ? `<br><span style="color: #666; font-size: 12px;">${vial.vialSize}</span>` : ''}
        </td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e5e5e5; text-align: center; font-size: 14px;">${item.quantity}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e5e5e5; text-align: right; font-size: 14px;">$${(item.unit_price_cents / 100).toFixed(2)}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e5e5e5; text-align: right; font-size: 14px;">$${(item.total_cents / 100).toFixed(2)}</td>
      </tr>
    `;
  }).join('');

  const shippingOption = getShippingOption(order.shipping_method);
  const shippingLabel = shippingOption ? shippingOption.label : order.shipping_method;
  const addr = order.shipping_address;

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
      <div style="border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 24px;">
        <h1 style="font-size: 18px; margin: 0; letter-spacing: 1px;">RANGE MEDICAL</h1>
        <p style="font-size: 12px; color: #666; margin: 4px 0 0;">Order Confirmation</p>
      </div>

      <p style="font-size: 14px; margin-bottom: 20px;">Hi ${patient.name.split(' ')[0]},</p>
      <p style="font-size: 14px; margin-bottom: 24px;">Thank you for your order. Here are the details of your purchase:</p>

      <div style="background: #f8f8f8; padding: 14px 16px; margin-bottom: 20px;">
        <p style="margin: 0; font-size: 13px;"><strong>Order #:</strong> ${order.order_number}</p>
        <p style="margin: 4px 0 0; font-size: 13px;"><strong>Date:</strong> ${todayPacific()}</p>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
          <tr style="background: #f0f0f0;">
            <th style="padding: 8px 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #666;">Item</th>
            <th style="padding: 8px 12px; text-align: center; font-size: 12px; text-transform: uppercase; color: #666;">Qty</th>
            <th style="padding: 8px 12px; text-align: right; font-size: 12px; text-transform: uppercase; color: #666;">Price</th>
            <th style="padding: 8px 12px; text-align: right; font-size: 12px; text-transform: uppercase; color: #666;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3" style="padding: 8px 12px; text-align: right; font-size: 14px;">Subtotal</td>
            <td style="padding: 8px 12px; text-align: right; font-size: 14px;">$${(order.subtotal_cents / 100).toFixed(2)}</td>
          </tr>
          <tr>
            <td colspan="3" style="padding: 8px 12px; text-align: right; font-size: 14px;">Shipping (${shippingLabel})</td>
            <td style="padding: 8px 12px; text-align: right; font-size: 14px;">$${order.shipping_cents > 0 ? (order.shipping_cents / 100).toFixed(2) : 'FREE'}</td>
          </tr>
          <tr style="border-top: 2px solid #000;">
            <td colspan="3" style="padding: 10px 12px; text-align: right; font-size: 16px; font-weight: bold;">Total</td>
            <td style="padding: 10px 12px; text-align: right; font-size: 16px; font-weight: bold;">$${(order.total_cents / 100).toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>

      ${addr ? `
        <div style="margin-bottom: 20px;">
          <p style="font-size: 12px; text-transform: uppercase; color: #666; margin-bottom: 6px;">Ship To</p>
          <p style="font-size: 14px; margin: 0;">${addr.name}</p>
          <p style="font-size: 14px; margin: 0;">${addr.street}${addr.street2 ? `, ${addr.street2}` : ''}</p>
          <p style="font-size: 14px; margin: 0;">${addr.city}, ${addr.state} ${addr.zip}</p>
        </div>
      ` : `
        <div style="margin-bottom: 20px;">
          <p style="font-size: 12px; text-transform: uppercase; color: #666; margin-bottom: 6px;">Pickup Location</p>
          <p style="font-size: 14px; margin: 0;">${shippingLabel}</p>
        </div>
      `}

      <div style="border-top: 1px solid #e5e5e5; padding-top: 16px; margin-top: 24px; font-size: 12px; color: #666;">
        <p style="margin: 0;"><strong>Questions?</strong> Call or text: (949) 997-3988</p>
        <p style="margin: 4px 0 0;">range-medical.com</p>
        <p style="margin: 8px 0 0; font-size: 11px;">1901 Westcliff Drive, Suite 10, Newport Beach, CA 92660</p>
      </div>
    </div>
  `;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const decoded = verifyToken(req);
  if (!decoded) return res.status(401).json({ error: 'Unauthorized' });

  const { paymentIntentId, items, shippingMethod, shippingAddress, notes, testMode } = req.body;

  // Verify payment succeeded (skip for test orders)
  const isTest = testMode && paymentIntentId.startsWith('test_');
  if (!isTest) {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ error: 'Payment not confirmed' });
    }
  }

  // Get patient
  const { data: patient } = await supabase
    .from('patients')
    .select('id, name, email, phone')
    .eq('id', decoded.patientId)
    .single();

  if (!patient) return res.status(404).json({ error: 'Patient not found' });

  // Build validated line items from catalog
  const orderItems = items.map(item => {
    const vial = getVialById(item.peptideId);
    if (!vial) throw new Error(`Unknown peptide: ${item.peptideId}`);
    return {
      peptide_id: vial.id,
      name: `${vial.name}${vial.subtitle ? ` (${vial.subtitle})` : ''}`,
      vial_size: vial.vialSize,
      quantity: item.quantity,
      unit_price_cents: vial.priceCents,
      total_cents: vial.priceCents * item.quantity,
    };
  });

  const subtotalCents = orderItems.reduce((sum, i) => sum + i.total_cents, 0);
  const shippingOption = getShippingOption(shippingMethod);
  const shippingCents = shippingOption ? shippingOption.price : 0;
  const totalCents = subtotalCents + shippingCents;

  const orderNumber = generateOrderNumber();

  // Determine if shipping address needed
  const isPickup = shippingMethod.startsWith('pickup');
  const addressData = isPickup ? null : shippingAddress;

  // Create shop order
  const { data: order, error: orderError } = await supabase
    .from('shop_orders')
    .insert({
      patient_id: patient.id,
      order_number: orderNumber,
      status: 'paid',
      items: orderItems,
      subtotal_cents: subtotalCents,
      shipping_cents: shippingCents,
      total_cents: totalCents,
      shipping_method: shippingMethod,
      shipping_address: addressData,
      notes: notes || null,
      stripe_payment_intent_id: paymentIntentId,
    })
    .select()
    .single();

  if (orderError) {
    console.error('Order creation error:', orderError);
    return res.status(500).json({ error: 'Failed to create order' });
  }

  // Create purchase record (financial side)
  const { data: purchase } = await supabase
    .from('purchases')
    .insert({
      patient_id: patient.id,
      patient_name: patient.name,
      patient_email: patient.email,
      patient_phone: patient.phone,
      item_name: 'Peptide Therapy',
      product_name: 'Peptide Therapy',
      category: 'peptide',
      amount: isTest ? 0 : totalCents / 100,
      amount_paid: isTest ? 0 : totalCents / 100,
      quantity: orderItems.reduce((sum, i) => sum + i.quantity, 0),
      stripe_payment_intent_id: paymentIntentId,
      stripe_amount_cents: totalCents,
      stripe_status: 'succeeded',
      stripe_verified_at: new Date().toISOString(),
      payment_method: 'stripe',
      source: 'vial_shop',
      purchase_date: todayPacific(),
      description: `Vial Shop Order ${orderNumber}`,
    })
    .select()
    .single();

  // Link purchase to order
  if (purchase) {
    await supabase
      .from('shop_orders')
      .update({ purchase_id: purchase.id })
      .eq('id', order.id);
  }

  // Send itemized receipt email
  if (patient.email) {
    try {
      const emailResult = await resend.emails.send({
        from: 'Range Medical <noreply@range-medical.com>',
        to: patient.email,
        bcc: 'info@range-medical.com',
        subject: `Your Range Medical Order — ${orderNumber}`,
        html: buildReceiptEmail(patient, { ...order, shipping_address: addressData }, orderItems),
      });
      console.log('Receipt email sent:', patient.email, emailResult);
    } catch (emailErr) {
      console.error('Receipt email error:', emailErr);
    }
  } else {
    console.log('No patient email — skipping receipt');
  }

  // SMS notify staff
  try {
    const { sendSMS } = require('../../../lib/send-sms');
    const itemSummary = orderItems.map(i => `${i.quantity}x ${i.name}`).join(', ');
    await sendSMS({
      to: '+19496900339',
      message: `Vial Shop Order ${orderNumber}\n${patient.name}\n${itemSummary}\nTotal: $${(totalCents / 100).toFixed(2)}\n${isPickup ? 'Pickup' : 'Ship to: ' + addressData?.city + ', ' + addressData?.state}`,
      log: {
        messageType: 'shop_order_notification',
        source: 'shop-confirm-order',
        patientId: patient.id,
      },
    });
  } catch (smsErr) {
    console.error('SMS notify error:', smsErr);
  }

  res.status(200).json({
    success: true,
    orderNumber,
    orderId: order.id,
  });
}
