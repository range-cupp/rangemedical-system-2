import { createClient } from '@supabase/supabase-js';

/*
  CREATE TABLE lab_clarity_bookings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name text NOT NULL,
    email text NOT NULL,
    phone text NOT NULL,
    dob date,
    concern text,
    appointment_start timestamptz NOT NULL,
    appointment_end timestamptz NOT NULL,
    created_at timestamptz DEFAULT now(),
    status text DEFAULT 'confirmed'
  );
*/

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fullName, email, phone, dob, concern, date, time } = req.body;

    if (!fullName || !email || !phone || !date || !time) {
      return res.status(400).json({ error: 'Please fill out all required fields.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    const offset = getPacificOffset(date);
    const appointment_start = `${date}T${time}:00${offset}`;
    const endTime = addMinutes(time, 30);
    const appointment_end = `${date}T${endTime}:00${offset}`;

    const { data, error: dbError } = await supabase
      .from('lab_clarity_bookings')
      .insert({
        full_name: fullName,
        email,
        phone,
        dob: dob || null,
        concern: concern || null,
        appointment_start,
        appointment_end,
      })
      .select()
      .single();

    if (dbError) throw dbError;

    await supabase.from('appointments').insert({
      patient_name: fullName,
      patient_phone: phone,
      service_name: 'Lab Clarity Visit',
      service_category: 'consultation',
      provider: 'Brendyn Reed',
      location: 'newport',
      start_time: appointment_start,
      end_time: appointment_end,
      duration_minutes: 30,
      status: 'confirmed',
      source: 'lab-clarity-funnel',
      notes: concern || null,
    });

    await sendConfirmationEmail({ fullName, email, date, time });

    return res.status(200).json({ success: true, booking: data });
  } catch (err) {
    console.error('Lab clarity booking error:', err);
    return res.status(500).json({ error: 'Failed to book. Please try again.' });
  }
}

function getPacificOffset(dateStr) {
  const d = new Date(dateStr + 'T12:00:00Z');
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    timeZoneName: 'short',
  }).formatToParts(d);
  const tz = parts.find(p => p.type === 'timeZoneName')?.value;
  return tz === 'PDT' ? '-07:00' : '-08:00';
}

function addMinutes(time, minutes) {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutes;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

async function sendConfirmationEmail({ fullName, email, date, time }) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) return;

  const displayDate = new Date(date + 'T12:00:00Z').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'America/Los_Angeles',
  });

  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const dh = h > 12 ? h - 12 : h;
  const displayTime = `${dh}:${String(m).padStart(2, '0')} ${ampm} PT`;

  const firstName = fullName.split(' ')[0];

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#FAF9F6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF9F6;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;">

        <tr><td style="background:#2E5D3A;padding:28px 32px;">
          <p style="margin:0;font-size:18px;font-weight:600;color:#ffffff;">Range Medical</p>
        </td></tr>

        <tr><td style="padding:32px;">
          <p style="margin:0 0 20px;font-size:16px;color:#1a1a1a;line-height:1.6;">
            Hi ${firstName},
          </p>
          <p style="margin:0 0 24px;font-size:16px;color:#1a1a1a;line-height:1.6;">
            Your Lab Clarity Visit is confirmed. Here are the details:
          </p>

          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f6f3;border-radius:8px;margin-bottom:24px;">
            <tr><td style="padding:20px 24px;">
              <p style="margin:0 0 8px;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:#737373;">Your Appointment</p>
              <p style="margin:0 0 4px;font-size:16px;color:#1a1a1a;font-weight:500;">${displayDate}</p>
              <p style="margin:0 0 12px;font-size:16px;color:#1a1a1a;font-weight:500;">${displayTime}</p>
              <p style="margin:0 0 2px;font-size:14px;color:#737373;">Range Medical</p>
              <p style="margin:0;font-size:14px;color:#737373;">1901 Westcliff Drive, Suite 10, Newport Beach, CA 92660</p>
            </td></tr>
          </table>

          <p style="margin:0 0 20px;font-size:15px;color:#1a1a1a;line-height:1.6;">
            <strong>Reminder:</strong> Your $97 visit fee is credited toward any lab panel or treatment you choose within 7 days.
          </p>

          <p style="margin:0 0 8px;font-size:14px;color:#737373;line-height:1.5;">
            <strong style="color:#1a1a1a;">When you arrive:</strong> Check in at the front desk. No paperwork needed ahead of time.
          </p>
          <p style="margin:0 0 0;font-size:14px;color:#737373;line-height:1.5;">
            <strong style="color:#1a1a1a;">Need to reschedule?</strong> Reply to this email at least 24 hours before your visit and we’ll help you move it.
          </p>
        </td></tr>

        <tr><td style="padding:0 32px 28px;">
          <hr style="border:none;border-top:1px solid #e0ddd8;margin:0 0 20px;" />
          <p style="margin:0;font-size:12px;color:#999;line-height:1.5;">
            Range Medical &bull; 1901 Westcliff Drive, Suite 10, Newport Beach, CA 92660 &bull; (949) 997-3988
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Range Medical <noreply@range-medical.com>',
        to: email,
        bcc: 'info@range-medical.com',
        subject: `Your Lab Clarity Visit is booked, ${firstName}`,
        html,
      }),
    });
  } catch (err) {
    console.error('Failed to send confirmation email:', err);
  }
}
