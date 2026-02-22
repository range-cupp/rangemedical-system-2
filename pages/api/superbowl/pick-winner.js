// /pages/api/superbowl/pick-winner.js
// Super Bowl LX Giveaway - Winner Selection
// Range Medical - 2026-02-08
//
// Protected endpoint - requires ADMIN_SECRET header
// Usage: POST /api/superbowl/pick-winner?winning_team=patriots
//        Header: x-admin-secret: <your-secret>

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { sendSMS } from '../../../lib/twilio';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const GHL_API_KEY = process.env.GHL_API_KEY;
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID;
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'range-superbowl-2026';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Auth check
  const providedSecret = req.headers['x-admin-secret'];
  if (providedSecret !== ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { winning_team } = req.query;

  if (!winning_team || !['patriots', 'seahawks'].includes(winning_team)) {
    return res.status(400).json({
      error: 'Invalid winning_team. Must be "patriots" or "seahawks"'
    });
  }

  try {
    // Get all entries that picked the winning team and haven't already won
    const { data: eligibleEntries, error: fetchError } = await supabase
      .from('superbowl_giveaway_entries')
      .select('*')
      .eq('team_pick', winning_team)
      .eq('is_winner', false);

    if (fetchError) {
      console.error('Fetch error:', fetchError);
      return res.status(500).json({ error: 'Failed to fetch entries' });
    }

    if (!eligibleEntries || eligibleEntries.length === 0) {
      return res.status(404).json({
        error: 'No eligible entries found for the winning team',
        winning_team,
        total_eligible: 0
      });
    }

    console.log(`Found ${eligibleEntries.length} eligible entries for ${winning_team}`);

    // Cryptographically secure random selection
    const randomBytes = crypto.randomBytes(4);
    const randomIndex = randomBytes.readUInt32BE(0) % eligibleEntries.length;
    const winner = eligibleEntries[randomIndex];

    console.log('Selected winner:', winner.id, winner.first_name, winner.last_name);

    // Mark as winner in database
    const { error: updateError } = await supabase
      .from('superbowl_giveaway_entries')
      .update({
        is_winner: true,
        winner_selected_at: new Date().toISOString()
      })
      .eq('id', winner.id);

    if (updateError) {
      console.error('Update error:', updateError);
      return res.status(500).json({ error: 'Failed to update winner status' });
    }

    // Send winner notification SMS
    let smsSent = false;
    const formattedPhone = `+1${winner.phone_number}`;

    try {
      let ghlContactId = winner.ghl_contact_id;

      // Send winner SMS via Twilio - include referrer if they had one
      const referrerNote = winner.referred_by
        ? ` And great news — ${winner.referred_by} who referred you wins one too!`
        : '';
      const winnerMessage = `Congratulations! You won the Range Medical Super Bowl Giveaway! You've won a FREE Elite Panel Lab Draw valued at $750.${referrerNote} Call us at (949) 997-3988 or reply to this text to schedule your appointment. — Range Medical, Newport Beach`;

      const smsResult = await sendSMS(winner.phone_number, winnerMessage);

      if (smsResult) {
        smsSent = true;
        console.log('Winner SMS sent successfully');

        // Mark as notified
        await supabase
          .from('superbowl_giveaway_entries')
          .update({ winner_notified: true })
          .eq('id', winner.id);
      } else {
        console.error('Winner SMS error for:', winner.phone_number);
      }

      // Add note to GHL contact if we have one
      if (ghlContactId && GHL_API_KEY) {
        // Add winner tag
        await fetch(
          `https://services.leadconnectorhq.com/contacts/${ghlContactId}`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${GHL_API_KEY}`,
              'Version': '2021-07-28',
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({
              tags: ['superbowl-winner', 'superbowl-giveaway']
            })
          }
        );

        const referrerNoteText = winner.referred_by
          ? `\n\n⚠️ REFERRER ALSO WINS: ${winner.referred_by}\nPlease locate this person in the system and notify them that they also won a FREE Elite Panel.`
          : '';
        await fetch(
          `https://services.leadconnectorhq.com/contacts/${ghlContactId}/notes`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${GHL_API_KEY}`,
              'Version': '2021-07-28',
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({
              body: `🏆 SUPER BOWL GIVEAWAY WINNER!\n\nThis patient won the Range Medical Super Bowl LX Giveaway!\n\nPrize: FREE Elite Panel Lab Draw ($750 value)${referrerNoteText}\n\nPlease schedule their appointment when they call/text.`
            })
          }
        );
      }

    } catch (smsError) {
      console.error('SMS notification error:', smsError);
    }

    // Get stats
    const { data: allEntries } = await supabase
      .from('superbowl_giveaway_entries')
      .select('team_pick');

    const stats = {
      total_entries: allEntries?.length || 0,
      patriots_picks: allEntries?.filter(e => e.team_pick === 'patriots').length || 0,
      seahawks_picks: allEntries?.filter(e => e.team_pick === 'seahawks').length || 0,
      eligible_for_winning_team: eligibleEntries.length
    };

    return res.status(200).json({
      success: true,
      message: 'Winner selected!',
      winning_team,
      winner: {
        id: winner.id,
        first_name: winner.first_name,
        last_name: winner.last_name,
        phone_number: winner.phone_number,
        referred_by: winner.referred_by,
        health_interests: winner.health_interests
      },
      referrer_also_wins: winner.referred_by ? true : false,
      notification_sent: smsSent,
      stats
    });

  } catch (error) {
    console.error('Pick winner error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
