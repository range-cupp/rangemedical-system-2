// /lib/receipt-email.js
// Purchase receipt email template — Range Medical
// Matches branding from wl-drip-emails.js: black header, left-border sections, #f5f5f5 background

export function generateReceiptHtml({
  firstName,
  patientName,
  patientPhone,
  patientAddress,
  invoiceId,
  date,
  description,
  originalAmountCents,
  discountLabel,
  amountPaidCents,
  cardBrand,
  cardLast4,
}) {
  const isComp = amountPaidCents === 0;
  const amountPaid = isComp ? 'Complimentary' : `$${(amountPaidCents / 100).toFixed(2)}`;
  const hasDiscount = !isComp && originalAmountCents && originalAmountCents !== amountPaidCents;
  const originalAmount = hasDiscount ? `$${(originalAmountCents / 100).toFixed(2)}` : null;
  const paymentMethod = isComp
    ? 'Complimentary'
    : cardBrand && cardLast4
      ? `${cardBrand.toUpperCase()} ending in ${cardLast4}`
      : 'Payment processed';

  // Build patient info rows for the "Billed To" section
  const billedToRows = [];
  if (patientName) billedToRows.push(patientName);
  if (patientAddress) billedToRows.push(patientAddress);
  if (patientPhone) billedToRows.push(patientPhone);

  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Receipt from Range Medical</title>
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
                            <p style="margin: 10px 0 0; color: #a3a3a3; font-size: 14px;">Purchase Receipt</p>
                        </td>
                    </tr>

                    <!-- Main Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <p style="margin: 0 0 24px; color: #404040; font-size: 15px; line-height: 1.7;">Hi ${firstName},</p>

                            <p style="margin: 0 0 30px; color: #404040; font-size: 15px; line-height: 1.7;">Thank you for your visit. Here is your receipt.</p>

                            ${billedToRows.length > 0 ? `
                            <!-- Billed To -->
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 0 0 24px;">
                                <tr>
                                    <td style="border-left: 4px solid #000000; padding-left: 20px;">
                                        <p style="margin: 0 0 4px; color: #888; font-size: 11px; text-transform: uppercase; font-weight: 600; letter-spacing: 0.05em;">Billed To</p>
                                        <p style="margin: 0; color: #111; font-size: 14px; line-height: 1.6;">${billedToRows.join('<br>')}</p>
                                    </td>
                                </tr>
                            </table>
                            ` : ''}

                            <!-- Invoice Details -->
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 0 0 30px;">
                                <tr>
                                    <td style="border-left: 4px solid #000000; padding-left: 20px;">
                                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                            <tr>
                                                <td style="padding: 6px 0; color: #888; font-size: 13px; width: 140px;">Invoice #</td>
                                                <td style="padding: 6px 0; color: #111; font-size: 14px;">${invoiceId}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 6px 0; color: #888; font-size: 13px;">Date</td>
                                                <td style="padding: 6px 0; color: #111; font-size: 14px;">${date}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 6px 0; color: #888; font-size: 13px;">Service</td>
                                                <td style="padding: 6px 0; color: #111; font-size: 14px;">${description}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 6px 0; color: #888; font-size: 13px;">Payment Method</td>
                                                <td style="padding: 6px 0; color: #111; font-size: 14px;">${paymentMethod}</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <!-- Amount Summary -->
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #fafafa; border-radius: 8px; margin: 0 0 30px;">
                                <tr>
                                    <td style="padding: 20px 24px;">
                                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                            ${hasDiscount ? `
                                            <tr>
                                                <td style="padding: 4px 0; color: #555; font-size: 14px;">Original Amount</td>
                                                <td style="padding: 4px 0; color: #555; font-size: 14px; text-align: right;">${originalAmount}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 4px 0; color: #16A34A; font-size: 14px;">Discount${discountLabel ? ` (${discountLabel})` : ''}</td>
                                                <td style="padding: 4px 0; color: #16A34A; font-size: 14px; text-align: right;">-$${((originalAmountCents - amountPaidCents) / 100).toFixed(2)}</td>
                                            </tr>
                                            <tr>
                                                <td colspan="2" style="padding: 8px 0 4px;"><hr style="border: none; border-top: 1px solid #e0e0e0; margin: 0;" /></td>
                                            </tr>
                                            ` : ''}
                                            <tr>
                                                <td style="padding: 4px 0; color: #111; font-size: 16px; font-weight: 700;">Amount Paid</td>
                                                <td style="padding: 4px 0; color: #111; font-size: 16px; font-weight: 700; text-align: right;">${amountPaid}</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <!-- Download Receipt -->
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 0 0 30px;">
                                <tr>
                                    <td align="center">
                                        <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://rangemedical.com'}/api/receipt/${invoiceId}" style="display: inline-block; background-color: #000000; color: #ffffff; padding: 12px 28px; border-radius: 6px; font-size: 14px; font-weight: 600; text-decoration: none;">Download Receipt PDF</a>
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
