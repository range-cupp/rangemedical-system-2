// Daily Action Tip — email helpers
// Used by /api/daily/subscribe, /api/daily/manychat, /api/cron/daily-welcome, /api/cron/daily-tip

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = 'Chris Cupp <cupp@range-medical.com>';
const REPLY_TO = 'cupp@range-medical.com';
const SITE_ORIGIN = 'https://www.range-medical.com';

// ============================================================
// Welcome email loader (reads /emails/welcome/welcome-N.md)
// ============================================================

const WELCOME_DIR = path.join(process.cwd(), 'emails', 'welcome');

export function loadWelcomeEmail(step) {
  if (![1, 2, 3].includes(step)) {
    throw new Error(`Invalid welcome step: ${step}`);
  }
  const filePath = path.join(WELCOME_DIR, `welcome-${step}.md`);
  const raw = fs.readFileSync(filePath, 'utf8');
  return parseEmailFile(raw);
}

// File format:
// ---
// subject: The Subject Line Here
// ---
//
// Body text starts here.
// Line breaks preserved.
function parseEmailFile(raw) {
  const fmMatch = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  if (!fmMatch) {
    throw new Error('Email file missing frontmatter (--- subject: ... ---)');
  }
  const fm = fmMatch[1];
  const body = raw.slice(fmMatch[0].length).trim();
  const subjectMatch = fm.match(/^subject:\s*(.+)$/m);
  if (!subjectMatch) throw new Error('Email file missing subject in frontmatter');
  return { subject: subjectMatch[1].trim(), body };
}

// ============================================================
// Unsubscribe token (HMAC-signed subscriber ID)
// ============================================================

function unsubscribeSecret() {
  const secret = process.env.UNSUBSCRIBE_SECRET;
  if (!secret) throw new Error('UNSUBSCRIBE_SECRET env var not set');
  return secret;
}

export function makeUnsubscribeToken(subscriberId) {
  const sig = crypto
    .createHmac('sha256', unsubscribeSecret())
    .update(subscriberId)
    .digest('base64url');
  return `${subscriberId}.${sig}`;
}

export function verifyUnsubscribeToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [subscriberId, sig] = parts;
  const expected = crypto
    .createHmac('sha256', unsubscribeSecret())
    .update(subscriberId)
    .digest('base64url');
  // constant-time compare
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return null;
  if (!crypto.timingSafeEqual(a, b)) return null;
  return subscriberId;
}

export function unsubscribeUrl(subscriberId) {
  // Points at the API route so Gmail's one-click POST (List-Unsubscribe-Post:
  // List-Unsubscribe=One-Click) hits an actual handler. The route handles both
  // GET (user click → unsubscribe + redirect to confirmation page) and POST
  // (Gmail one-click → unsubscribe + 200).
  return `${SITE_ORIGIN}/api/daily/unsubscribe?token=${makeUnsubscribeToken(subscriberId)}`;
}

// ============================================================
// Email rendering (plain text → simple HTML)
// ============================================================

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Convert plain-text body → HTML. Preserves paragraphs & line breaks.
// Auto-links URLs.
function bodyToHtml(body) {
  const safe = escapeHtml(body);
  const linked = safe.replace(
    /(https?:\/\/[^\s<]+)/g,
    '<a href="$1" style="color:#0a0a0a;text-decoration:underline;">$1</a>'
  );
  // Double newlines → paragraph breaks; single newlines → <br>
  const paragraphs = linked.split(/\n{2,}/).map(p =>
    `<p style="margin:0 0 16px 0;">${p.replace(/\n/g, '<br>')}</p>`
  );
  return paragraphs.join('\n');
}

export function buildEmailHtml({ body, unsubscribeLink }) {
  const bodyHtml = bodyToHtml(body);
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,sans-serif;color:#1a1a1a;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;">
    <tr><td align="center" style="padding:32px 16px 16px;">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;">
        <tr><td style="font-size:16px;line-height:1.6;color:#1a1a1a;padding:0 4px;">
          ${bodyHtml}
        </td></tr>
        <tr><td style="padding:32px 4px 0;border-top:1px solid #e5e5e5;margin-top:24px;">
          <p style="font-size:11px;line-height:1.5;color:#999;margin:24px 0 4px 0;">
            Range Medical · 1901 Westcliff Drive, Suite 10, Newport Beach, CA
          </p>
          <p style="font-size:11px;line-height:1.5;color:#999;margin:0;">
            <a href="${unsubscribeLink}" style="color:#999;text-decoration:underline;">Unsubscribe</a>
            &nbsp;·&nbsp;
            You're receiving this because you signed up for the Daily Action Tip.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// Build plain-text version (with unsubscribe link appended)
export function buildEmailText({ body, unsubscribeLink }) {
  return `${body}

—
Range Medical · 1901 Westcliff Drive, Suite 10, Newport Beach, CA
Unsubscribe: ${unsubscribeLink}
`;
}

// ============================================================
// Send helpers
// ============================================================

// Send a single email with all the right headers (List-Unsubscribe, etc.)
export async function sendDailyEmail({ to, subject, body, subscriberId }) {
  const unsubLink = unsubscribeUrl(subscriberId);
  const html = buildEmailHtml({ body, unsubscribeLink: unsubLink });
  const text = buildEmailText({ body, unsubscribeLink: unsubLink });

  const result = await resend.emails.send({
    from: FROM,
    to,
    replyTo: REPLY_TO,
    subject,
    html,
    text,
    headers: {
      'List-Unsubscribe': `<${unsubLink}>, <mailto:cupp@range-medical.com?subject=unsubscribe>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
  });

  if (result.error) {
    throw new Error(`Resend error: ${result.error.message || JSON.stringify(result.error)}`);
  }
  return { messageId: result.data?.id || null };
}

// Send welcome email step (1, 2, or 3) to a subscriber
export async function sendWelcomeStep({ subscriberId, email, step }) {
  const { subject, body } = loadWelcomeEmail(step);
  return sendDailyEmail({ to: email, subject, body, subscriberId });
}

// ============================================================
// Subscribe + welcome email 1 (shared by landing-page form and ManyChat webhook)
// ============================================================

// Outcomes:
//   { ok: true, subscriberId, alreadySubscribed: bool, suppressed: bool }
// Suppressed = the email is on the permanent unsubscribe list. We return
// success to avoid leaking suppression state, but we don't actually send.
export async function subscribeAndSendWelcome({ supabase, email, source, metadata = {} }) {
  const cleanEmail = String(email || '').trim().toLowerCase();

  // Defensive: don't re-add anyone on the permanent suppression list.
  const { data: suppressed } = await supabase
    .from('daily_unsubscribes')
    .select('id')
    .eq('email', cleanEmail)
    .maybeSingle();

  if (suppressed) {
    return { ok: true, suppressed: true, alreadySubscribed: false, subscriberId: null };
  }

  // Upsert subscriber. If they already exist + unsubscribed, reactivate.
  const { data: existing } = await supabase
    .from('daily_subscribers')
    .select('id, status, welcome_sequence_started_at, welcome_sequence_completed')
    .eq('email', cleanEmail)
    .maybeSingle();

  let subscriber;
  let alreadySubscribed = false;

  if (existing) {
    alreadySubscribed = existing.status === 'active' && !!existing.welcome_sequence_started_at;
    const { data: updated, error: updErr } = await supabase
      .from('daily_subscribers')
      .update({
        status: 'active',
        unsubscribed_at: null,
        source,
        welcome_sequence_started_at: existing.welcome_sequence_started_at || new Date().toISOString(),
        metadata: { ...(metadata || {}), source },
      })
      .eq('id', existing.id)
      .select('id, welcome_sequence_started_at')
      .single();
    if (updErr) throw updErr;
    subscriber = updated;
  } else {
    const { data: inserted, error: insErr } = await supabase
      .from('daily_subscribers')
      .insert({
        email: cleanEmail,
        source,
        status: 'active',
        welcome_sequence_started_at: new Date().toISOString(),
        metadata: metadata || {},
      })
      .select('id, welcome_sequence_started_at')
      .single();
    if (insErr) throw insErr;
    subscriber = inserted;
  }

  // Skip welcome 1 if it's already been sent.
  const { data: alreadySent } = await supabase
    .from('daily_sends')
    .select('id')
    .eq('subscriber_id', subscriber.id)
    .eq('welcome_sequence_step', 1)
    .maybeSingle();

  if (!alreadySent) {
    try {
      const { messageId } = await sendWelcomeStep({
        subscriberId: subscriber.id,
        email: cleanEmail,
        step: 1,
      });
      await supabase.from('daily_sends').insert({
        subscriber_id: subscriber.id,
        welcome_sequence_step: 1,
        resend_message_id: messageId,
      });
      await supabase
        .from('daily_subscribers')
        .update({ last_sent_at: new Date().toISOString() })
        .eq('id', subscriber.id);
    } catch (sendErr) {
      // Don't fail the signup if email send hiccups — log and move on.
      console.error('[daily] welcome 1 send failed:', sendErr.message);
    }
  }

  return {
    ok: true,
    suppressed: false,
    alreadySubscribed,
    subscriberId: subscriber.id,
  };
}
