// lib/invoice-email.js
// Invoice email template — Range Medical
// Same visual style as receipt-email.js but with "Pay Now" CTA

export function generateInvoiceHtml({
  firstName,
  invoiceId,
  date,
  items,
  totalCents,
  paymentUrl,
  notes,
}) {
  const total = `$${(totalCents / 100).toFixed(2)}`;

  const itemRows = items.map(item => `
    <tr>
      <td style="padding: 8px 0; color: #111; font-size: 14px; border-bottom: 1px solid #f0f0f0;">${item.name}${item.quantity > 1 ? ` x${item.quantity}` : ''}</td>
      <td style="padding: 8px 0; color: #111; font-size: 14px; text-align: right; border-bottom: 1px solid #f0f0f0;">$${(item.price_cents / 100).toFixed(2)}</td>
    </tr>
  `).join('');

  const notesSection = notes ? `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 0 0 30px;">
      <tr>
        <td style="border-left: 4px solid #000000; padding-left: 20px;">
          <p style="margin: 0 0 4px; color: #888; font-size: 13px;">Notes</p>
          <p style="margin: 0; color: #111; font-size: 14px;">${notes}</p>
        </td>
      </tr>
    </table>
  ` : '';

  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice from Range Medical</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f5f5f5;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; max-width: 600px;">

                    <!-- Header -->
                    <tr>
                        <td style="background-color: #000000; padding: 30px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: 0.1em;">RANGE MEDICAL</h1>
                            <p style="margin: 10px 0 0; color: #a3a3a3; font-size: 14px;">Invoice</p>
                        </td>
                    </tr>

                    <!-- Main Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <p style="margin: 0 0 24px; color: #404040; font-size: 15px; line-height: 1.7;">Hi ${firstName},</p>

                            <p style="margin: 0 0 30px; color: #404040; font-size: 15px; line-height: 1.7;">You have a pending invoice from Range Medical.</p>

                            <!-- Invoice Details -->
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 0 0 30px;">
                                <tr>
                                    <td style="border-left: 4px solid #000000; padding-left: 20px;">
                                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                            <tr>
                                                <td style="padding: 6px 0; color: #888; font-size: 13px; width: 140px;">Invoice #</td>
                                                <td style="padding: 6px 0; color: #111; font-size: 14px;">${invoiceId.slice(0, 8).toUpperCase()}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 6px 0; color: #888; font-size: 13px;">Date</td>
                                                <td style="padding: 6px 0; color: #111; font-size: 14px;">${date}</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <!-- Line Items -->
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 0 0 20px;">
                                <tr>
                                    <td style="padding: 8px 0; color: #888; font-size: 13px; font-weight: 600; border-bottom: 2px solid #eee;">Item</td>
                                    <td style="padding: 8px 0; color: #888; font-size: 13px; font-weight: 600; text-align: right; border-bottom: 2px solid #eee;">Amount</td>
                                </tr>
                                ${itemRows}
                            </table>

                            <!-- Total -->
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #fafafa; border-radius: 8px; margin: 0 0 30px;">
                                <tr>
                                    <td style="padding: 20px 24px;">
                                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                            <tr>
                                                <td style="padding: 4px 0; color: #111; font-size: 16px; font-weight: 700;">Amount Due</td>
                                                <td style="padding: 4px 0; color: #111; font-size: 16px; font-weight: 700; text-align: right;">${total}</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            ${notesSection}

                            <!-- Pay Now Button -->
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 0 0 30px;">
                                <tr>
                                    <td align="center">
                                        <a href="${paymentUrl}" style="display: inline-block; background-color: #16A34A; color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">Pay Now</a>
                                    </td>
                                </tr>
                            </table>

                            <!-- Clinic Address -->
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 0 0 20px;">
                                <tr>
                                    <td style="border-left: 4px solid #000000; padding-left: 20px;">
                                        <p style="margin: 0 0 4px; color: #111; font-size: 14px; font-weight: 600;">Range Medical</p>
                                        <p style="margin: 0; color: #666; font-size: 13px; line-height: 1.6;">1901 Westcliff Dr Suite 10<br>Newport Beach, CA 92660</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #fafafa; padding: 24px 30px; border-top: 1px solid #eee;">
                            <p style="margin: 0; color: #888; font-size: 13px; text-align: center; line-height: 1.6;">
                                Questions? Call us at <strong>(949) 997-3988</strong> or email <a href="mailto:info@range-medical.com" style="color: #555;">info@range-medical.com</a>
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
}
