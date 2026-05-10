// Temporary — sends all 5 HBOT drip emails to a specified address for review
import { Resend } from 'resend';
import {
  getEmail1Subject, getEmail1Html,
  getEmail2Subject, getEmail2Html,
  getEmail3Subject, getEmail3Html,
  getEmail4Subject, getEmail4Html,
  getEmail5Subject, getEmail5Html,
} from '../../../lib/hbot-drip-emails';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  const secret = req.query.secret || req.headers['x-cron-secret'];
  if (secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const to = req.query.to;
  if (!to) return res.status(400).json({ error: 'Missing ?to= param' });

  const firstName = 'Chris';
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 7);
  const expiryDate = expiry.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
    timeZone: 'America/Los_Angeles',
  });
  const struggles = ['energy', 'recovery', 'sleep'];

  const emails = [
    { step: 1, subjectFn: getEmail1Subject, htmlFn: getEmail1Html },
    { step: 2, subjectFn: getEmail2Subject, htmlFn: getEmail2Html },
    { step: 3, subjectFn: getEmail3Subject, htmlFn: getEmail3Html },
    { step: 4, subjectFn: getEmail4Subject, htmlFn: getEmail4Html },
    { step: 5, subjectFn: getEmail5Subject, htmlFn: getEmail5Html },
  ];

  const results = [];
  for (const { step, subjectFn, htmlFn } of emails) {
    try {
      const subject = `[PREVIEW ${step}/5] ${subjectFn({ firstName, struggles })}`;
      const html = htmlFn({ firstName, expiryDate, struggles });
      await resend.emails.send({
        from: 'Range Medical <hello@range-medical.com>',
        replyTo: 'info@range-medical.com',
        to,
        subject,
        html,
      });
      results.push({ step, status: 'sent' });
    } catch (err) {
      results.push({ step, status: 'error', error: err.message });
    }
  }

  return res.status(200).json({ ok: true, to, results });
}
