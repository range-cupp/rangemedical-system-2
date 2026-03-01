// /pages/api/ghl/conversations.js
// Fetch GHL conversation history for a given contact
// Returns SMS messages from the GHL Conversations API
// Range Medical System V2

const GHL_API_KEY = process.env.GHL_API_KEY;
const GHL_API_BASE = 'https://services.leadconnectorhq.com';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { contact_id } = req.query;

  if (!contact_id) {
    return res.status(400).json({ error: 'contact_id is required' });
  }

  if (!GHL_API_KEY) {
    return res.status(200).json({ messages: [], error: 'GHL not configured' });
  }

  try {
    // Step 1: Search for conversations by contact ID
    const searchRes = await fetch(
      `${GHL_API_BASE}/conversations/search?contactId=${contact_id}`,
      {
        headers: {
          'Authorization': `Bearer ${GHL_API_KEY}`,
          'Version': '2021-07-28',
          'Accept': 'application/json',
        },
      }
    );

    if (!searchRes.ok) {
      const errText = await searchRes.text();
      console.error('GHL conversations search error:', searchRes.status, errText);
      return res.status(200).json({ messages: [], error: 'GHL search failed' });
    }

    const searchData = await searchRes.json();
    const conversations = searchData.conversations || [];

    if (conversations.length === 0) {
      return res.status(200).json({ messages: [] });
    }

    // Step 2: Fetch messages from each conversation (typically just one per contact)
    const allMessages = [];

    for (const conv of conversations.slice(0, 3)) {
      try {
        const msgRes = await fetch(
          `${GHL_API_BASE}/conversations/${conv.id}/messages`,
          {
            headers: {
              'Authorization': `Bearer ${GHL_API_KEY}`,
              'Version': '2021-07-28',
              'Accept': 'application/json',
            },
          }
        );

        if (!msgRes.ok) {
          console.error('GHL messages fetch error for conversation', conv.id);
          continue;
        }

        const msgData = await msgRes.json();
        const messages = msgData.messages || [];

        for (const msg of messages) {
          // Only include SMS messages
          if (msg.type !== 'SMS' && msg.messageType !== 'SMS') continue;

          allMessages.push({
            id: `ghl_${msg.id}`,
            channel: 'sms',
            message_type: msg.direction === 1 ? 'inbound_sms' : 'ghl_sms',
            message: msg.body || msg.message || '',
            status: msg.status === 'delivered' ? 'sent' : (msg.status || 'sent'),
            direction: msg.direction === 1 ? 'inbound' : 'outbound',
            source: 'ghl',
            created_at: msg.dateAdded || msg.createdAt || msg.date,
          });
        }
      } catch (msgErr) {
        console.error('Error fetching GHL messages:', msgErr.message);
      }
    }

    // Sort by date, newest first
    allMessages.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return res.status(200).json({
      messages: allMessages,
      total: allMessages.length,
      conversationCount: conversations.length,
    });

  } catch (error) {
    console.error('GHL conversations error:', error);
    return res.status(200).json({ messages: [], error: error.message });
  }
}
