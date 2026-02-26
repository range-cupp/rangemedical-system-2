// lib/oxygen-emails.js
// 30-day email series templates — Chris Cupp / Range Medical
// Clean, minimal design matching range-medical.com

function wrapEmail({ firstName, dayNumber, subject, bodyHtml }) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #ffffff; color: #1a1a1a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #ffffff;">
    <tr>
      <td align="center" style="padding: 48px 20px;">
        <table role="presentation" width="560" cellspacing="0" cellpadding="0" style="max-width: 560px; width: 100%;">

          <!-- Day label -->
          <tr>
            <td style="padding-bottom: 32px;">
              <span style="font-size: 12px; font-weight: 600; letter-spacing: 0.12em; color: #b0b0b0; text-transform: uppercase;">Day ${dayNumber} of 30</span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="font-size: 16px; line-height: 1.7; color: #2a2a2a;">
              ${bodyHtml}
            </td>
          </tr>

          <!-- Sign-off -->
          <tr>
            <td style="padding-top: 36px; font-size: 15px; line-height: 1.6; color: #2a2a2a;">
              <p style="margin: 0;">Talk tomorrow,</p>
              <p style="margin: 4px 0 0; font-weight: 600;">Chris</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top: 48px; border-top: 1px solid #eee; margin-top: 48px;">
              <p style="font-size: 12px; color: #b0b0b0; line-height: 1.6; margin: 16px 0 0;">
                Chris Cupp &middot; Range Medical &middot; Newport Beach, CA<br>
                You signed up for 30 days of things worth knowing.<br>
                <a href="%unsubscribe_url%" style="color: #999;">Unsubscribe</a>
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

export function generateDay1Html({ firstName }) {
  const bodyHtml = `
    <p style="margin: 0 0 20px;">Hey ${firstName},</p>

    <p style="margin: 0 0 20px;">Welcome. You asked for this, so let's get into it.</p>

    <p style="margin: 0 0 20px;">Here's something most people don't realize: the standard blood panel your doctor orders once a year checks about 15-20 markers. That sounds like a lot until you learn there are over 100 markers that can tell you meaningful things about how your body is actually functioning.</p>

    <p style="margin: 0 0 20px;">The annual physical panel is designed to catch disease. It's not designed to tell you how well you're performing, recovering, or aging. There's a massive gap between "nothing's wrong" and "everything's optimized" — and most people live their entire lives in that gap without knowing it.</p>

    <p style="margin: 0 0 20px;">Here's an example: standard panels rarely include insulin. They check glucose, sure. But glucose is a lagging indicator. By the time your glucose is elevated, your body has been compensating with high insulin for years — sometimes a decade. Fasting insulin is one of the single most useful numbers you can know, and almost nobody checks it.</p>

    <p style="margin: 0 0 20px;">Same goes for inflammatory markers like hs-CRP, hormone panels beyond just TSH, and nutrient levels like magnesium, B12, and vitamin D. These aren't exotic labs. They're available at any draw station. They're just not part of the default order.</p>

    <p style="margin: 0 0 20px;"><strong>What you can do today:</strong> The next time you get bloodwork, ask your provider to add fasting insulin and hs-CRP to the panel. If they ask why, tell them you want a baseline. That's it. Two markers, and you'll know more about your metabolic and inflammatory health than most people ever will.</p>

    <p style="margin: 0 0 20px;">Tomorrow: something your body does every night that most people are accidentally sabotaging.</p>
  `;

  return wrapEmail({
    firstName,
    dayNumber: 1,
    subject: 'Day 1: The one thing your blood test isn\'t telling you',
    bodyHtml,
  });
}
