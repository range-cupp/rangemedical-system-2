/**
 * Range Medical — Vercel Cron API Route
 *
 * Drop this file into your CRM repo at:
 *   app/api/reports/daily/route.ts   (Next.js App Router)
 *   — or —
 *   pages/api/reports/daily.ts       (Pages Router)
 *
 * Then add to vercel.json:
 *   {
 *     "crons": [{
 *       "path": "/api/reports/daily",
 *       "schedule": "0 8 * * *"          <-- runs 8:00 AM UTC = midnight Pacific
 *     }]
 *   }
 *
 * The route also accepts a ?date=YYYY-MM-DD query param for manual runs
 * or backfills (useful during testing).
 *
 * Auth: Vercel automatically sends the CRON_SECRET header on cron invocations.
 * Protect manual runs by checking it yourself (see below).
 *
 * Required env vars (add to Vercel project settings):
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_KEY
 *   RESEND_API_KEY
 *   DIGEST_FROM
 *   DIGEST_TO
 *   CRON_SECRET   -- set in Vercel dashboard, used to protect manual calls
 */

// ── Next.js App Router version (app/api/reports/daily/route.ts) ──────────────
//
// import { NextResponse } from 'next/server';
// import { generateReport } from '@/lib/reports/generate-report';
// import { sendDigest }     from '@/lib/reports/send-digest';
//
// export const maxDuration = 60; // allow up to 60s for this route
//
// export async function GET(req: Request) {
//   // Verify caller is either Vercel cron or an authorized manual trigger
//   const authHeader = req.headers.get('authorization');
//   if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
//     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//   }
//
//   const url    = new URL(req.url);
//   const date   = url.searchParams.get('date') || getYesterday();
//
//   try {
//     const report = await generateReport(date);
//     await sendDigest(date);
//     return NextResponse.json({ ok: true, date, revenue: report.total_revenue_cents });
//   } catch (err: any) {
//     console.error('Daily report failed:', err);
//     return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
//   }
// }
//
// function getYesterday() {
//   const pacific = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
//   pacific.setDate(pacific.getDate() - 1);
//   return pacific.toISOString().slice(0, 10);
// }


// ── Pages Router version (pages/api/reports/daily.ts) ────────────────────────
//
// import type { NextApiRequest, NextApiResponse } from 'next';
// import { generateReport } from '../../lib/reports/generate-report';
// import { sendDigest }     from '../../lib/reports/send-digest';
//
// export const config = { maxDuration: 60 };
//
// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//   const authHeader = req.headers['authorization'];
//   if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
//     return res.status(401).json({ error: 'Unauthorized' });
//   }
//
//   const date = (req.query.date as string) || getYesterday();
//
//   try {
//     const report = await generateReport(date);
//     await sendDigest(date);
//     res.json({ ok: true, date, revenue: report.total_revenue_cents });
//   } catch (err: any) {
//     console.error('Daily report failed:', err);
//     res.status(500).json({ ok: false, error: err.message });
//   }
// }


// ── vercel.json snippet ───────────────────────────────────────────────────────
//
// {
//   "crons": [
//     {
//       "path": "/api/reports/daily",
//       "schedule": "0 8 * * *"
//     }
//   ]
// }
//
// "0 8 * * *" = 8:00 AM UTC = midnight Pacific Standard Time.
// Adjust to "0 9 * * *" during daylight saving (PDT = UTC-7).
// Or use a fixed local-time cron service to avoid DST drift.


// ── Manual backfill helper ────────────────────────────────────────────────────
//
// To run for a specific past date:
//   curl -H "Authorization: Bearer $CRON_SECRET" \
//        "https://your-crm.vercel.app/api/reports/daily?date=2026-01-06"
//
// To run all dates in a range from the CLI:
//   for d in $(seq 0 30 | xargs -I{} date -d "2026-01-01 +{} days" +%F); do
//     node generate-report.js $d && node send-digest.js $d
//   done
