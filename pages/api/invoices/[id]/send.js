// POST /api/invoices/[id]/send
// Send invoice via SMS, email, or both
// SMS uses unified Blooio/Twilio router with two-step opt-in for Blooio

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { generateInvoiceHtml } from '../../../../lib/invoice-email';
import { logComm } from '../../../../lib/comms-log';
import { sendSMS, normalizePhone } from '../../../../lib/send-sms';
import { hasBlooioOptIn, queuePendingLinkMessage, isBlooioProvider } from '../../../../lib/blooio-optin';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const { via } = req.body; // 'sms' | 'email' | 'both'

  if (!via || !['sms', 'email', 'both'].includes(via)) {
    return res.status(400).json({ error: 'via must be "sms", "email", or "both"' });
  }

  try {
    // Get invoice
    const { data: invoice, error: fetchError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://app.range-medical.com';
    const paymentUrl = `${baseUrl}/invoice/${invoice.id}`;
    const total = `$${(invoice.total_cents / 100).toFixed(2)}`;
    const firstName = (invoice.patient_name || '').split(' ')[0] || 'there';
    let twoStep = false;

    // Send email
    if (via === 'email' || via === 'both') {
      if (invoice.patient_email) {
        try {
          const html = generateInvoiceHtml({
            firstName,
            invoiceId: invoice.id,
            date: new Date(invoice.created_at).toLocaleDateString('en-US', {
              year: 'numeric', month: 'long', day: 'numeric',
                          timeZone: 'America/Los_Angeles',
            }),
            items: invoice.items,
            totalCents: invoice.total_cents,
            paymentUrl,
            notes: invoice.notes,
          });

          const resend = new Resend(process.env.RESEND_API_KEY);
          await resend.emails.send({
            from: 'Range Medical <noreply@range-medical.com>',
            to: invoice.patient_email,
            bcc: 'info@range-medical.com',
            subject: `Invoice from Range Medical — ${total}`,
            html,
          });

          await logComm({
            channel: 'email',
            messageType: 'invoice',
            message: `Invoice ${total} — ${invoice.items.map(i => i.name).join(', ')}`,
            source: 'invoices/send',
            patientId: invoice.patient_id,
            patientName: invoice.patient_name,
            recipient: invoice.patient_email,
            subject: `Invoice from Range Medical — ${total}`,
            metadata: { invoice_id: invoice.id },
          });
        } catch (emailErr) {
          console.error('Invoice email error:', emailErr);
          await logComm({
            channel: 'email',
            messageType: 'invoice',
            message: `Invoice email failed for ${invoice.id}`,
            source: 'invoices/send',
            patientId: invoice.patient_id,
            status: 'error',
            errorMessage: emailErr.message,
          });
        }
      }
    }

    // Send SMS via unified Blooio/Twilio router
    if (via === 'sms' || via === 'both') {
      // Get patient phone number
      const phone = invoice.patient_phone || null;
      let patientPhone = phone;

      // If no phone on invoice, look up from patient record
      if (!patientPhone && invoice.patient_id) {
        const { data: patient } = await supabase
          .from('patients')
          .select('phone')
          .eq('id', invoice.patient_id)
          .single();
        patientPhone = patient?.phone || null;
      }

      if (patientPhone) {
        const normalizedPhone = normalizePhone(patientPhone);
        const fullMessage = `Hi ${firstName}, you have a ${total} invoice from Range Medical. Pay securely here: ${paymentUrl}`;

        try {
          // Check if Blooio requires two-step opt-in
          if (isBlooioProvider()) {
            const optedIn = await hasBlooioOptIn(normalizedPhone);

            if (!optedIn) {
              // Step 1: Send link-free opt-in message
              const optInMsg = `Hi ${firstName}, Range Medical here. You have a ${total} invoice ready. Reply YES to receive the payment link.`;
              const optInResult = await sendSMS({ to: normalizedPhone, message: optInMsg });

              if (optInResult.success) {
                // Queue the full message with payment link
                await queuePendingLinkMessage({
                  phone: normalizedPhone,
                  message: fullMessage,
                  messageType: 'invoice_link',
                  patientId: invoice.patient_id,
                  patientName: invoice.patient_name,
                });

                await logComm({
                  channel: 'sms',
                  messageType: 'invoice_optin',
                  message: optInMsg,
                  source: 'invoices/send',
                  patientId: invoice.patient_id,
                  patientName: invoice.patient_name,
                  recipient: normalizedPhone,
                  provider: optInResult.provider,
                  metadata: { invoice_id: invoice.id },
                });

                twoStep = true;
              }
            } else {
              // Already opted in — send full message with link
              const smsResult = await sendSMS({ to: normalizedPhone, message: fullMessage });

              await logComm({
                channel: 'sms',
                messageType: 'invoice',
                message: fullMessage,
                source: 'invoices/send',
                patientId: invoice.patient_id,
                patientName: invoice.patient_name,
                recipient: normalizedPhone,
                provider: smsResult.provider,
                status: smsResult.success ? 'sent' : 'error',
                errorMessage: smsResult.error || null,
                metadata: { invoice_id: invoice.id },
              });
            }
          } else {
            // Twilio — send directly (no opt-in needed)
            const smsResult = await sendSMS({ to: normalizedPhone, message: fullMessage });

            await logComm({
              channel: 'sms',
              messageType: 'invoice',
              message: fullMessage,
              source: 'invoices/send',
              patientId: invoice.patient_id,
              patientName: invoice.patient_name,
              recipient: normalizedPhone,
              provider: smsResult.provider,
              status: smsResult.success ? 'sent' : 'error',
              errorMessage: smsResult.error || null,
              metadata: { invoice_id: invoice.id },
            });
          }
        } catch (smsErr) {
          console.error('Invoice SMS error:', smsErr);
          await logComm({
            channel: 'sms',
            messageType: 'invoice',
            message: `Invoice SMS failed for ${invoice.id}`,
            source: 'invoices/send',
            patientId: invoice.patient_id,
            status: 'error',
            errorMessage: smsErr.message,
            provider: null,
          });
        }
      } else {
        console.warn(`No phone number for invoice ${invoice.id}`);
      }
    }

    // Update invoice status
    await supabase
      .from('invoices')
      .update({
        sent_via: via,
        sent_at: new Date().toISOString(),
        status: 'sent',
      })
      .eq('id', id);

    return res.status(200).json({
      success: true,
      payment_url: paymentUrl,
      twoStep,
      ...(twoStep ? { message: 'Opt-in text sent. Invoice link will be delivered when the patient replies YES.' } : {}),
    });
  } catch (error) {
    console.error('Send invoice error:', error);
    return res.status(500).json({ error: error.message });
  }
}
