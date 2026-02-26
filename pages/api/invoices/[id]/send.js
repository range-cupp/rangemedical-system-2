// POST /api/invoices/[id]/send
// Send invoice via SMS, email, or both

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { generateInvoiceHtml } from '../../../../lib/invoice-email';
import { logComm } from '../../../../lib/comms-log';

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

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://app.rangemedical.com';
    const paymentUrl = `${baseUrl}/invoice/${invoice.id}`;
    const total = `$${(invoice.total_cents / 100).toFixed(2)}`;
    const firstName = (invoice.patient_name || '').split(' ')[0] || 'there';

    // Send email
    if (via === 'email' || via === 'both') {
      if (invoice.patient_email) {
        try {
          const html = generateInvoiceHtml({
            firstName,
            invoiceId: invoice.id,
            date: new Date(invoice.created_at).toLocaleDateString('en-US', {
              year: 'numeric', month: 'long', day: 'numeric',
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

    // Send SMS
    if (via === 'sms' || via === 'both') {
      if (invoice.patient_id) {
        try {
          const { data: patient } = await supabase
            .from('patients')
            .select('ghl_contact_id, name')
            .eq('id', invoice.patient_id)
            .single();

          if (patient?.ghl_contact_id) {
            const message = `Hi ${firstName}, you have a ${total} invoice from Range Medical. Pay securely here: ${paymentUrl}`;

            await fetch(`${baseUrl}/api/ghl/send-sms`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ contact_id: patient.ghl_contact_id, message }),
            });

            await logComm({
              channel: 'sms',
              messageType: 'invoice',
              message,
              source: 'invoices/send',
              patientId: invoice.patient_id,
              patientName: invoice.patient_name,
              ghlContactId: patient.ghl_contact_id,
            });
          }
        } catch (smsErr) {
          console.error('Invoice SMS error:', smsErr);
        }
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

    return res.status(200).json({ success: true, payment_url: paymentUrl });
  } catch (error) {
    console.error('Send invoice error:', error);
    return res.status(500).json({ error: error.message });
  }
}
