// /lib/appointment-emails.js
// Patient-facing appointment email templates — Range Medical
// Matches branding from receipt-email.js: black header, left-border sections, #f5f5f5 background

/**
 * Generate booking confirmation email HTML
 */
function buildLabPrepHtml(gender, heading) {
  const generalItems = [
    '<strong>Fast for 10\u201312 hours</strong> before your draw (water &amp; black coffee are fine)',
    '<strong>Drink plenty of water</strong> 1\u20132 hours before',
    '<strong>Avoid NSAIDs</strong> (Advil, ibuprofen) for 48 hours before',
    '<strong>Skip thyroid meds</strong> the morning of (take after your draw)',
  ];

  const maleItems = [
    '<strong>Hold testosterone injections</strong> for 3 days before — schedule your draw for the morning of your injection day, before dosing',
    '<strong>PSA testing:</strong> avoid heavy workouts and sexual activity for 24 hours before',
  ];

  const femaleItems = [
    '<strong>Cycle timing:</strong> if cycling, Day 3 of your period gives the most accurate hormone results. If timing doesn\'t line up, don\'t cancel — call us at <strong>(949) 997-3988</strong>',
    '<strong>Estrogen &amp; progesterone:</strong> continue as normal',
    '<strong>Testosterone injections:</strong> hold for 3 days before labs',
  ];

  let items = [...generalItems];
  if (gender === 'male') items.push(...maleItems);
  else if (gender === 'female') items.push(...femaleItems);
  else items.push('<strong>If on testosterone injections:</strong> hold for 3 days before labs');

  const rows = items.map(item =>
    `<tr><td style="padding: 4px 0; color: #404040; font-size: 14px; line-height: 1.7;">&#x2022; ${item}</td></tr>`
  ).join('\n                                            ');

  return `
                            <!-- Lab Prep Instructions -->
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 0 0 30px;">
                                <tr>
                                    <td style="border-left: 4px solid #22c55e; padding-left: 20px;">
                                        <h3 style="margin: 0 0 12px; color: #000; font-size: 15px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">${heading}</h3>
                                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                            ${rows}
                                        </table>
                                        <p style="margin: 12px 0 0; font-size: 14px;">
                                            <a href="https://www.range-medical.com/lab-prep" style="color: #000; font-weight: 600; text-decoration: underline;">View full prep guide &rarr;</a>
                                        </p>
                                    </td>
                                </tr>
                            </table>`;
}

export function generateBookingConfirmationHtml({
  patientName,
  serviceName,
  date,
  time,
  duration,
  location,
  notes,
  isBloodDraw,
  gender,
}) {
  const firstName = (patientName || 'there').split(' ')[0];
  const locationDisplay = location || 'Range Medical — Newport Beach';

  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Appointment Confirmed — Range Medical</title>
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
                            <p style="margin: 10px 0 0; color: #a3a3a3; font-size: 14px;">Appointment Confirmed</p>
                        </td>
                    </tr>

                    <!-- Main Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <p style="margin: 0 0 24px; color: #404040; font-size: 15px; line-height: 1.7;">Hi ${firstName},</p>

                            <p style="margin: 0 0 30px; color: #404040; font-size: 15px; line-height: 1.7;">Your appointment has been confirmed. Here are the details:</p>

                            <!-- Appointment Details -->
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 0 0 30px;">
                                <tr>
                                    <td style="border-left: 4px solid #000000; padding-left: 20px;">
                                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                            <tr>
                                                <td style="padding: 6px 0; color: #888; font-size: 13px; width: 100px;">Service</td>
                                                <td style="padding: 6px 0; color: #111; font-size: 14px; font-weight: 600;">${serviceName || 'Appointment'}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 6px 0; color: #888; font-size: 13px;">Date</td>
                                                <td style="padding: 6px 0; color: #111; font-size: 14px;">${date}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 6px 0; color: #888; font-size: 13px;">Time</td>
                                                <td style="padding: 6px 0; color: #111; font-size: 14px;">${time}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 6px 0; color: #888; font-size: 13px;">Duration</td>
                                                <td style="padding: 6px 0; color: #111; font-size: 14px;">${duration} minutes</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 6px 0; color: #888; font-size: 13px;">Location</td>
                                                <td style="padding: 6px 0; color: #111; font-size: 14px;">${locationDisplay}</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            ${notes ? `
                            <!-- Notes -->
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 0 0 30px;">
                                <tr>
                                    <td style="background-color: #fafafa; padding: 15px 20px; border-left: 3px solid #000000;">
                                        <p style="margin: 0 0 4px; color: #888; font-size: 11px; text-transform: uppercase; font-weight: 600; letter-spacing: 0.05em;">Notes</p>
                                        <p style="margin: 0; color: #404040; font-size: 14px; line-height: 1.6;">${notes}</p>
                                    </td>
                                </tr>
                            </table>
                            ` : ''}

                            ${isBloodDraw ? buildLabPrepHtml(gender, 'How to Prepare') : ''}

                            <p style="margin: 0; color: #737373; font-size: 13px; line-height: 1.7;">Need to reschedule? Call us at <strong>(949) 997-3988</strong></p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #fafafa; padding: 24px 30px; border-top: 1px solid #eee;">
                            <p style="margin: 0; color: #888; font-size: 13px; text-align: center; line-height: 1.6;">
                                Questions? Call us at <strong>(949) 997-3988</strong> or email <a href="mailto:info@range-medical.com" style="color: #555;">info@range-medical.com</a>
                            </p>
                            <p style="margin: 10px 0 0; color: #a3a3a3; font-size: 12px; text-align: center;">Range Medical &#8226; Newport Beach, CA</p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
}

/**
 * Generate booking cancellation email HTML
 */
export function generateBookingCancellationHtml({
  patientName,
  serviceName,
  date,
  time,
}) {
  const firstName = (patientName || 'there').split(' ')[0];

  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Appointment Cancelled — Range Medical</title>
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
                            <p style="margin: 10px 0 0; color: #a3a3a3; font-size: 14px;">Appointment Cancelled</p>
                        </td>
                    </tr>

                    <!-- Main Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <p style="margin: 0 0 24px; color: #404040; font-size: 15px; line-height: 1.7;">Hi ${firstName},</p>

                            <p style="margin: 0 0 30px; color: #404040; font-size: 15px; line-height: 1.7;">Your appointment has been cancelled.</p>

                            <!-- Cancelled Appointment Details -->
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 0 0 30px;">
                                <tr>
                                    <td style="border-left: 4px solid #000000; padding-left: 20px;">
                                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                            <tr>
                                                <td style="padding: 6px 0; color: #888; font-size: 13px; width: 100px;">Service</td>
                                                <td style="padding: 6px 0; color: #111; font-size: 14px; font-weight: 600;">${serviceName || 'Appointment'}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 6px 0; color: #888; font-size: 13px;">Date</td>
                                                <td style="padding: 6px 0; color: #111; font-size: 14px;">${date}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 6px 0; color: #888; font-size: 13px;">Time</td>
                                                <td style="padding: 6px 0; color: #111; font-size: 14px;">${time}</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <!-- Reschedule CTA -->
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 0 0 20px;">
                                <tr>
                                    <td style="background-color: #fafafa; padding: 15px 20px; border-left: 3px solid #dc2626;">
                                        <p style="margin: 0; color: #404040; font-size: 14px; line-height: 1.6;">To reschedule, call us at <strong>(949) 997-3988</strong> or book online.</p>
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
                            <p style="margin: 10px 0 0; color: #a3a3a3; font-size: 12px; text-align: center;">Range Medical &#8226; Newport Beach, CA</p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
}

/**
 * Generate booking reschedule email HTML
 */
export function generateBookingRescheduleHtml({
  patientName,
  serviceName,
  date,
  time,
  duration,
  location,
  isBloodDraw,
  gender,
}) {
  const firstName = (patientName || 'there').split(' ')[0];
  const locationDisplay = location || 'Range Medical — Newport Beach';

  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Appointment Rescheduled — Range Medical</title>
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
                            <p style="margin: 10px 0 0; color: #a3a3a3; font-size: 14px;">Appointment Rescheduled</p>
                        </td>
                    </tr>

                    <!-- Main Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <p style="margin: 0 0 24px; color: #404040; font-size: 15px; line-height: 1.7;">Hi ${firstName},</p>

                            <p style="margin: 0 0 30px; color: #404040; font-size: 15px; line-height: 1.7;">Your appointment has been rescheduled. Here are the updated details:</p>

                            <!-- Updated Appointment Details -->
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 0 0 30px;">
                                <tr>
                                    <td style="border-left: 4px solid #000000; padding-left: 20px;">
                                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                            <tr>
                                                <td style="padding: 6px 0; color: #888; font-size: 13px; width: 100px;">Service</td>
                                                <td style="padding: 6px 0; color: #111; font-size: 14px; font-weight: 600;">${serviceName || 'Appointment'}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 6px 0; color: #888; font-size: 13px;">New Date</td>
                                                <td style="padding: 6px 0; color: #111; font-size: 14px;">${date}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 6px 0; color: #888; font-size: 13px;">New Time</td>
                                                <td style="padding: 6px 0; color: #111; font-size: 14px;">${time}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 6px 0; color: #888; font-size: 13px;">Duration</td>
                                                <td style="padding: 6px 0; color: #111; font-size: 14px;">${duration} minutes</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 6px 0; color: #888; font-size: 13px;">Location</td>
                                                <td style="padding: 6px 0; color: #111; font-size: 14px;">${locationDisplay}</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            ${isBloodDraw ? buildLabPrepHtml(gender, 'Prep Reminder') : ''}

                            <p style="margin: 0; color: #737373; font-size: 13px; line-height: 1.7;">Need to make changes? Call us at <strong>(949) 997-3988</strong></p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #fafafa; padding: 24px 30px; border-top: 1px solid #eee;">
                            <p style="margin: 0; color: #888; font-size: 13px; text-align: center; line-height: 1.6;">
                                Questions? Call us at <strong>(949) 997-3988</strong> or email <a href="mailto:info@range-medical.com" style="color: #555;">info@range-medical.com</a>
                            </p>
                            <p style="margin: 10px 0 0; color: #a3a3a3; font-size: 12px; text-align: center;">Range Medical &#8226; Newport Beach, CA</p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
}
