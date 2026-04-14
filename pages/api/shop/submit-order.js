// pages/api/shop/submit-order.js — Invoice-based order submission (no Stripe payment)
// Patient submits order → saved as pending_invoice → internal email to Damon → staff SMS
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import { Resend } from 'resend';
import { getVialById, getShippingOption } from '../../../lib/vial-catalog';
import { todayPacific } from '../../../lib/date-utils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
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

function buildInternalOrderEmail(patient, orderNumber, items, subtotalCents, shippingCents, totalCents, shippingMethod, shippingAddress, notes) {
  const shippingOption = getShippingOption(shippingMethod);
  const shippingLabel = shippingOption ? shippingOption.label : shippingMethod;
  const isPickup = shippingMethod.startsWith('pickup');

  const itemRows = items.map(item => `
    <tr>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e5e5e5; font-size: 14px;">
        <strong>${item.name}</strong><br><span style="color: #666; font-size: 12px;">${item.vial_size}</span>
      </td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e5e5e5; text-align: center; font-size: 14px;">${item.quantity}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e5e5e5; text-align: right; font-size: 14px;">$${(item.unit_price_cents / 100).toFixed(2)}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e5e5e5; text-align: right; font-size: 14px;">$${(item.total_cents / 100).toFixed(2)}</td>
    </tr>
  `).join('');

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
      <div style="background: #171717; color: #fff; padding: 16px 20px; margin-bottom: 24px;">
        <h1 style="font-size: 16px; margin: 0; letter-spacing: 1px;">NEW PEPTIDE ORDER</h1>
        <p style="font-size: 13px; margin: 4px 0 0; opacity: 0.8;">Action Required — Send Invoice</p>
      </div>

      <div style="background: #fffbeb; border: 1px solid #f59e0b; padding: 14px 16px; margin-bottom: 20px; border-radius: 4px;">
        <strong style="color: #92400e;">Action needed:</strong>
        <span style="color: #92400e;"> Send an invoice to this patient for $${(totalCents / 100).toFixed(2)} before fulfilling the order.</span>
      </div>

      <div style="background: #f8f8f8; padding: 14px 16px; margin-bottom: 20px;">
        <p style="margin: 0 0 6px; font-size: 13px;"><strong>Order #:</strong> ${orderNumber}</p>
        <p style="margin: 0 0 6px; font-size: 13px;"><strong>Date:</strong> ${todayPacific()}</p>
        <p style="margin: 0 0 6px; font-size: 13px;"><strong>Patient:</strong> ${patient.name}</p>
        ${patient.email ? `<p style="margin: 0 0 6px; font-size: 13px;"><strong>Email:</strong> ${patient.email}</p>` : ''}
        ${patient.phone ? `<p style="margin: 0; font-size: 13px;"><strong>Phone:</strong> ${patient.phone}</p>` : ''}
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
            <td style="padding: 8px 12px; text-align: right; font-size: 14px;">$${(subtotalCents / 100).toFixed(2)}</td>
          </tr>
          <tr>
            <td colspan="3" style="padding: 8px 12px; text-align: right; font-size: 14px;">Shipping (${shippingLabel})</td>
            <td style="padding: 8px 12px; text-align: right; font-size: 14px;">${shippingCents > 0 ? '$' + (shippingCents / 100).toFixed(2) : 'FREE'}</td>
          </tr>
          <tr style="border-top: 2px solid #000;">
            <td colspan="3" style="padding: 10px 12px; text-align: right; font-size: 16px; font-weight: bold;">Total Due</td>
            <td style="padding: 10px 12px; text-align: right; font-size: 16px; font-weight: bold;">$${(totalCents / 100).toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>

      <div style="margin-bottom: 20px;">
        <p style="font-size: 12px; text-transform: uppercase; color: #666; margin-bottom: 6px; font-weight: 600;">
          ${isPickup ? 'Pickup Location' : 'Ship To'}
        </p>
        ${isPickup ? `
          <p style="font-size: 14px; margin: 0;">${shippingLabel}</p>
        ` : `
          <p style="font-size: 14px; margin: 0;">${shippingAddress.name}</p>
          <p style="font-size: 14px; margin: 0;">${shippingAddress.street}${shippingAddress.street2 ? ', ' + shippingAddress.street2 : ''}</p>
          <p style="font-size: 14px; margin: 0;">${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.zip}</p>
        `}
      </div>

      ${notes ? `
        <div style="margin-bottom: 20px; background: #f0f7ff; padding: 12px 16px; border-left: 3px solid #3b82f6;">
          <p style="font-size: 12px; text-transform: uppercase; color: #666; margin: 0 0 4px; font-weight: 600;">Patient Notes</p>
          <p style="font-size: 14px; margin: 0; color: #333;">${notes}</p>
        </div>
      ` : ''}

      <div style="border-top: 1px solid #e5e5e5; padding-top: 16px; margin-top: 24px; font-size: 12px; color: #666;">
        <p style="margin: 0;"><strong>Next steps:</strong> Send invoice to patient \u2192 Receive payment \u2192 Fulfill order</p>
      </div>
    </div>
  `;
}

function buildPatientConfirmationEmail(patient, orderNumber, items, subtotalCents, shippingCents, totalCents, shippingMethod, shippingAddress) {
  const shippingOption = getShippingOption(shippingMethod);
  const shippingLabel = shippingOption ? shippingOption.label : shippingMethod;
  const isPickup = shippingMethod.startsWith('pickup');

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

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
      <div style="border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 24px;">
        <h1 style="font-size: 18px; margin: 0; letter-spacing: 1px;">RANGE MEDICAL</h1>
        <p style="font-size: 12px; color: #666; margin: 4px 0 0;">Order Received</p>
      </div>

      <p style="font-size: 14px; margin-bottom: 20px;">Hi ${patient.name.split(' ')[0]},</p>
      <p style="font-size: 14px; margin-bottom: 24px;">We've received your order! We'll send you an invoice shortly. Once payment is received, we'll ${isPickup ? 'have your order ready for pickup' : 'ship your order right away'}.</p>

      <div style="background: #f8f8f8; padding: 14px 16px; margin-bottom: 20px;">
        <p style="margin: 0; font-size: 13px;"><strong>Order #:</strong> ${orderNumber}</p>
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
            <td style="padding: 8px 12px; text-align: right; font-size: 14px;">$${(subtotalCents / 100).toFixed(2)}</td>
          </tr>
          <tr>
            <td colspan="3" style="padding: 8px 12px; text-align: right; font-size: 14px;">Shipping (${shippingLabel})</td>
            <td style="padding: 8px 12px; text-align: right; font-size: 14px;">${shippingCents > 0 ? '$' + (shippingCents / 100).toFixed(2) : 'FREE'}</td>
          </tr>
          <tr style="border-top: 2px solid #000;">
            <td colspan="3" style="padding: 10px 12px; text-align: right; font-size: 16px; font-weight: bold;">Total</td>
            <td style="padding: 10px 12px; text-align: right; font-size: 16px; font-weight: bold;">$${(totalCents / 100).toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>

      ${!isPickup && shippingAddress ? `
        <div style="margin-bottom: 20px;">
          <p style="font-size: 12px; text-transform: uppercase; color: #666; margin-bottom: 6px;">Ship To</p>
          <p style="font-size: 14px; margin: 0;">${shippingAddress.name}</p>
          <p style="font-size: 14px; margin: 0;">${shippingAddress.street}${shippingAddress.street2 ? ', ' + shippingAddress.street2 : ''}</p>
          <p style="font-size: 14px; margin: 0;">${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.zip}</p>
        </div>
      ` : `
        <div style="margin-bottom: 20px;">
          <p style="font-size: 12px; text-transform: uppercase; color: #666; margin-bottom: 6px;">Pickup Location</p>
          <p style="font-size: 14px; margin: 0;">${shippingLabel}</p>
        </div>
      `}

      <div style="background: #f0f7ff; padding: 14px 16px; margin-bottom: 20px; border-left: 3px solid #3b82f6;">
        <p style="font-size: 14px; margin: 0; color: #333;">
          <strong>What happens next?</strong> You'll receive an invoice from us shortly. Once payment is complete, we'll prepare your order.
        </p>
      </div>

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

  const { items, shippingMethod, shippingAddress, notes } = req.body;

  if (!items || items.length === 0) return res.status(400).json({ error: 'No items in order' });

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
  const isPickup = shippingMethod.startsWith('pickup');
  const addressData = isPickup ? null : shippingAddress;

  // Create shop order with pending_invoice status
  const { data: order, error: orderError } = await supabase
    .from('shop_orders')
    .insert({
      patient_id: patient.id,
      order_number: orderNumber,
      status: 'pending_invoice',
      items: orderItems,
      subtotal_cents: subtotalCents,
      shipping_cents: shippingCents,
      total_cents: totalCents,
      shipping_method: shippingMethod,
      shipping_address: addressData,
      notes: notes || null,
    })
    .select()
    .single();

  if (orderError) {
    console.error('Order creation error:', orderError);
    return res.status(500).json({ error: 'Failed to create order' });
  }

  // Send internal order notification to Damon
  try {
    await resend.emails.send({
      from: 'Range Medical <noreply@range-medical.com>',
      to: 'damon@range-medical.com',
      cc: 'info@range-medical.com',
      subject: `New Peptide Order — ${orderNumber} — ${patient.name} — $${(totalCents / 100).toFixed(2)}`,
      html: buildInternalOrderEmail(patient, orderNumber, orderItems, subtotalCents, shippingCents, totalCents, shippingMethod, addressData, notes),
    });
    console.log('Internal order email sent to damon@range-medical.com');
  } catch (emailErr) {
    console.error('Internal order email error:', emailErr);
  }

  // Send confirmation email to patient
  if (patient.email) {
    try {
      await resend.emails.send({
        from: 'Range Medical <noreply@range-medical.com>',
        to: patient.email,
        subject: `Order Received — ${orderNumber} — Range Medical`,
        html: buildPatientConfirmationEmail(patient, orderNumber, orderItems, subtotalCents, shippingCents, totalCents, shippingMethod, addressData),
      });
      console.log('Patient confirmation email sent:', patient.email);
    } catch (emailErr) {
      console.error('Patient confirmation email error:', emailErr);
    }
  }

  // SMS notify staff
  try {
    const { sendSMS } = require('../../../lib/send-sms');
    const itemSummary = orderItems.map(i => `${i.quantity}x ${i.name}`).join(', ');
    await sendSMS({
      to: '+19496900339',
      message: `New Peptide Order ${orderNumber}\n${patient.name}\n${itemSummary}\nTotal: $${(totalCents / 100).toFixed(2)}\n${isPickup ? 'Pickup' : 'Ship to: ' + addressData?.city + ', ' + addressData?.state}\n\nInvoice needed — check email`,
      log: {
        messageType: 'shop_order_notification',
        source: 'shop-submit-order',
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
