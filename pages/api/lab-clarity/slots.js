import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const MORNING_SLOTS = ['09:00','09:30','10:00','10:30','11:00','11:30'];
const AFTERNOON_SLOTS = ['13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30'];
const ALL_SLOTS = [...MORNING_SLOTS, ...AFTERNOON_SLOTS];

const ACTIVE_STATUSES = ['scheduled', 'confirmed', 'checked_in', 'in_progress', 'completed'];

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { date } = req.query;
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'Valid date (YYYY-MM-DD) is required.' });
  }

  try {
    const dow = new Date(date + 'T12:00:00Z').getUTCDay();
    const provider = (dow === 4 || dow === 5) ? 'Brendyn Reed' : 'Damien Burgess';

    const offset = getPacificOffset(date);
    const dayStart = `${date}T00:00:00${offset}`;
    const dayEnd = `${date}T23:59:59${offset}`;

    const { data: existing, error: dbError } = await supabase
      .from('appointments')
      .select('start_time, end_time')
      .eq('provider', provider)
      .gte('start_time', dayStart)
      .lte('start_time', dayEnd)
      .in('status', ACTIVE_STATUSES);

    if (dbError) throw dbError;

    const bookedSlots = new Set();
    for (const appt of existing || []) {
      const start = new Date(appt.start_time);
      const startPacific = new Date(start.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
      const h = String(startPacific.getHours()).padStart(2, '0');
      const m = String(startPacific.getMinutes()).padStart(2, '0');
      bookedSlots.add(`${h}:${m}`);
    }

    const now = new Date();
    const pacificNow = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));

    const available = ALL_SLOTS.filter(time => {
      if (bookedSlots.has(time)) return false;

      const [h, m] = time.split(':').map(Number);
      const [y, mo, d] = date.split('-').map(Number);
      const slotDate = new Date(y, mo - 1, d, h, m);
      if (slotDate <= pacificNow) return false;

      return true;
    }).map(time => {
      const [h, m] = time.split(':').map(Number);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const displayH = h > 12 ? h - 12 : h;
      return { time, label: `${displayH}:${String(m).padStart(2, '0')} ${ampm}` };
    });

    return res.status(200).json({ slots: available, provider });
  } catch (err) {
    console.error('Lab clarity slots error:', err);
    return res.status(500).json({ error: 'Failed to load slots.' });
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
