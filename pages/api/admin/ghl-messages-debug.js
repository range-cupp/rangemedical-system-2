// /pages/api/admin/ghl-messages-debug.js
// Diagnostic: test GHL Conversations Messages API with various parameters
// Temporary debug endpoint

const GHL_API_KEY = process.env.GHL_API_KEY;
const GHL_API_BASE = 'https://services.leadconnectorhq.com';

async function safeJson(response) {
  const text = await response.text();
  try { return JSON.parse(text); } catch { return { raw: text }; }
}

export default async function handler(req, res) {
  const { contact_id } = req.query;

  if (!contact_id) {
    return res.status(400).json({ error: 'Provide ?contact_id=xxx' });
  }

  const results = {};

  try {
    // 1. Search conversations
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
    const searchData = await safeJson(searchRes);
    const conversations = searchData.conversations || [];

    results.conversations = conversations.map(c => ({
      id: c.id,
      type: c.type,
      lastMessageBody: c.lastMessageBody?.substring(0, 100),
      lastMessageDate: c.lastMessageDate,
      lastMessageType: c.lastMessageType,
      inbox: c.inbox,
      contactId: c.contactId,
    }));

    if (conversations.length === 0) {
      return res.status(200).json(results);
    }

    const convId = conversations[0].id;

    // 2. Try messages with default params
    const msg1Res = await fetch(
      `${GHL_API_BASE}/conversations/${convId}/messages`,
      {
        headers: {
          'Authorization': `Bearer ${GHL_API_KEY}`,
          'Version': '2021-07-28',
          'Accept': 'application/json',
        },
      }
    );
    results.defaultMessages = {
      status: msg1Res.status,
      data: await safeJson(msg1Res),
    };

    // 3. Try with type=TYPE_SMS filter
    const msg2Res = await fetch(
      `${GHL_API_BASE}/conversations/${convId}/messages?type=TYPE_SMS`,
      {
        headers: {
          'Authorization': `Bearer ${GHL_API_KEY}`,
          'Version': '2021-07-28',
          'Accept': 'application/json',
        },
      }
    );
    results.smsFilteredMessages = {
      status: msg2Res.status,
      data: await safeJson(msg2Res),
    };

    // 4. Try different API version
    const msg3Res = await fetch(
      `${GHL_API_BASE}/conversations/${convId}/messages`,
      {
        headers: {
          'Authorization': `Bearer ${GHL_API_KEY}`,
          'Version': '2021-04-15',
          'Accept': 'application/json',
        },
      }
    );
    results.oldVersionMessages = {
      status: msg3Res.status,
      data: await safeJson(msg3Res),
    };

    // 5. Try the GET conversations/{id} endpoint (single conversation details)
    const convRes = await fetch(
      `${GHL_API_BASE}/conversations/${convId}`,
      {
        headers: {
          'Authorization': `Bearer ${GHL_API_KEY}`,
          'Version': '2021-07-28',
          'Accept': 'application/json',
        },
      }
    );
    results.conversationDetails = {
      status: convRes.status,
      data: await safeJson(convRes),
    };

    return res.status(200).json(results);
  } catch (error) {
    return res.status(500).json({ error: error.message, results });
  }
}
