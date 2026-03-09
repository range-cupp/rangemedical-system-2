// /pages/api/ghl/sync-messages.js
// GHL integration disabled — returns empty messages
export default async function handler(req, res) {
  return res.status(200).json({ disabled: true, message: 'GHL integration disabled', messages: [] });
}
