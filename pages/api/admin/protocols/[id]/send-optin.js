// /pages/api/admin/protocols/[id]/send-optin.js
// Send peptide check-in opt-in SMS from the protocol detail page
// Uses unified sendSMS (Blooio/Twilio) — no GHL dependency
// Range Medical

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { logComm } from '../../../../../lib/comms-log';
import { sendSMS, normalizePhone } from '../../../../../lib/send-sms';
import { hasBlooioOptIn, queuePendingLinkMessage, isBlooioProvider } from '../../../../../lib/blooio-optin';
import { todayPacific } from '../../../../../lib/date-utils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://app.range-medical.com';

export default async function handler(req, res) {
  // Opt-in flow disabled — peptide patients now receive weekly check-in texts
  // automatically via the peptide-reminders cron. No enrollment message needed.
  return res.status(200).json({
    success: false,
    message: 'Opt-in flow is disabled. Weekly check-ins are sent automatically.',
  });
}
