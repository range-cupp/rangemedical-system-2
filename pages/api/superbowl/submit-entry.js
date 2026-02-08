// /pages/api/superbowl/submit-entry.js
// Super Bowl LX Giveaway - Entry Submission
// Range Medical - 2026-02-08

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const GHL_API_KEY = process.env.GHL_API_KEY;
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID || 'WICdvbXmTjQORW6GiHWW';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    first_name,
    last_name,
    phone_number,
    referred_by,
    team_pick,
    health_interests,
    other_interest,
    utm_source,
    sms_consent
  } = req.body;

  // Validation
  if (!first_name || !last_name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  if (!phone_number || phone_number.length !== 10) {
    return res.status(400).json({ error: 'Valid phone number is required' });
  }

  if (!team_pick || !['patriots', 'seahawks'].includes(team_pick)) {
    return res.status(400).json({ error: 'Please pick a team' });
  }

  try {
    // Format phone to E.164
    const formattedPhone = `+1${phone_number}`;

    // Build health interests array
    let interests = health_interests || [];
    if (other_interest && interests.includes('other')) {
      interests = interests.filter(i => i !== 'other');
      interests.push(`other: ${other_interest}`);
    }

    // Check for existing entry with this phone
    const { data: existingEntry } = await supabase
      .from('superbowl_giveaway_entries')
      .select('id')
      .eq('phone_number', phone_number)
      .single();

    if (existingEntry) {
      return res.status(400).json({
        error: 'This phone number has already been entered. Good luck!'
      });
    }

    // Insert entry into Supabase
    const { data: entry, error: insertError } = await supabase
      .from('superbowl_giveaway_entries')
      .insert({
        first_name,
        last_name,
        phone_number,
        referred_by: referred_by || null,
        team_pick,
        health_interests: interests,
        utm_source: utm_source || 'instagram',
        sms_consent: sms_consent || false
      })
      .select()
      .single();

    if (insertError) {
      console.error('Supabase insert error:', insertError);

      // Check if duplicate constraint error
      if (insertError.code === '23505') {
        return res.status(400).json({
          error: 'This phone number has already been entered. Good luck!'
        });
      }

      return res.status(500).json({ error: 'Failed to submit entry' });
    }

    console.log('Entry created:', entry.id);

    // Create or find GHL contact
    let ghlContactId = null;

    try {
      // Search for existing contact
      const searchResponse = await fetch(
        `https://services.leadconnectorhq.com/contacts/?locationId=${GHL_LOCATION_ID}&query=${phone_number}&limit=1`,
        {
          headers: {
            'Authorization': `Bearer ${GHL_API_KEY}`,
            'Version': '2021-07-28',
            'Accept': 'application/json'
          }
        }
      );

      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        if (searchData.contacts && searchData.contacts.length > 0) {
          ghlContactId = searchData.contacts[0].id;
          console.log('Found existing GHL contact:', ghlContactId);
        }
      }

      // Build tags array
      const ghlTags = ['superbowl-2026-entry', `sb-pick-${team_pick}`];
      if (sms_consent) {
        ghlTags.push('sms-consent');
      }
      if (utm_source) {
        ghlTags.push(`source-${utm_source}`);
      }

      // If no contact found, create one
      if (!ghlContactId) {
        const createResponse = await fetch(
          `https://services.leadconnectorhq.com/contacts/`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${GHL_API_KEY}`,
              'Version': '2021-07-28',
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({
              locationId: GHL_LOCATION_ID,
              phone: formattedPhone,
              firstName: first_name,
              lastName: last_name,
              source: 'Super Bowl 2026 Giveaway',
              tags: ghlTags
            })
          }
        );

        if (createResponse.ok) {
          const createData = await createResponse.json();
          ghlContactId = createData.contact?.id;
          console.log('Created GHL contact:', ghlContactId);
        } else {
          const errorText = await createResponse.text();
          console.error('GHL create contact error:', createResponse.status, errorText);
        }
      } else {
        // Update existing contact with tags
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
              tags: ghlTags
            })
          }
        );
      }

      // Send confirmation SMS
      if (ghlContactId) {
        // Small delay to allow GHL to fully process the contact
        await new Promise(resolve => setTimeout(resolve, 1500));

        const teamName = team_pick === 'patriots' ? 'Patriots' : 'Seahawks';
        const referrerNote = referred_by ? ` If you win, ${referred_by} wins too.` : '';
        const smsMessage = `You are in! Your pick: ${teamName}.${referrerNote} We will text you after the game if you are our winner. Good luck! - Range Medical (949) 997-3988`;

        const smsResponse = await fetch(
          `https://services.leadconnectorhq.com/conversations/messages`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${GHL_API_KEY}`,
              'Version': '2021-07-28',
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({
              type: 'SMS',
              contactId: ghlContactId,
              message: smsMessage
            })
          }
        );

        if (smsResponse.ok) {
          console.log('Confirmation SMS sent to:', phone_number);
        } else {
          const smsError = await smsResponse.text();
          console.error('SMS send error:', smsResponse.status, smsError);
        }

        // Add note to contact
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
              body: `🏈 SUPER BOWL GIVEAWAY ENTRY\n\nTeam Pick: ${team_pick === 'patriots' ? 'New England Patriots' : 'Seattle Seahawks'}${referred_by ? `\nReferred By: ${referred_by}` : ''}\nHealth Interests: ${interests.length > 0 ? interests.join(', ') : 'None specified'}\nSource: ${utm_source || 'instagram'}\n\nEntry ID: ${entry.id}`
            })
          }
        );

        // Update entry with GHL contact ID
        await supabase
          .from('superbowl_giveaway_entries')
          .update({ ghl_contact_id: ghlContactId })
          .eq('id', entry.id);
      }

      // Send notification SMS to Chris
      try {
        // Find Chris's contact by phone
        const chrisSearchResponse = await fetch(
          `https://services.leadconnectorhq.com/contacts/?locationId=${GHL_LOCATION_ID}&query=9496900339&limit=1`,
          {
            headers: {
              'Authorization': `Bearer ${GHL_API_KEY}`,
              'Version': '2021-07-28',
              'Accept': 'application/json'
            }
          }
        );

        if (chrisSearchResponse.ok) {
          const chrisSearchData = await chrisSearchResponse.json();
          if (chrisSearchData.contacts && chrisSearchData.contacts.length > 0) {
            const chrisContactId = chrisSearchData.contacts[0].id;
            const teamName = team_pick === 'patriots' ? 'Patriots' : 'Seahawks';
            const notifyMessage = `New SB entry: ${first_name} ${last_name} picked ${teamName}.${referred_by ? ` Referred by: ${referred_by}.` : ''}`;

            await fetch(
              `https://services.leadconnectorhq.com/conversations/messages`,
              {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${GHL_API_KEY}`,
                  'Version': '2021-07-28',
                  'Content-Type': 'application/json',
                  'Accept': 'application/json'
                },
                body: JSON.stringify({
                  type: 'SMS',
                  contactId: chrisContactId,
                  message: notifyMessage
                })
              }
            );
            console.log('Admin notification sent');
          }
        }
      } catch (notifyError) {
        console.error('Admin notify error (non-fatal):', notifyError);
      }

    } catch (ghlError) {
      console.error('GHL error (non-fatal):', ghlError);
      // Continue - entry was still saved
    }

    return res.status(200).json({
      success: true,
      message: 'Entry submitted successfully',
      entryId: entry.id
    });

  } catch (error) {
    console.error('Submit entry error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
