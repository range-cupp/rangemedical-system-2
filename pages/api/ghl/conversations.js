// /pages/api/ghl/conversations.js
// GHL integration disabled — returns empty conversations
export default async function handler(req, res) {
  return res.status(200).json({ disabled: true, message: 'GHL integration disabled', conversations: [] });
}
