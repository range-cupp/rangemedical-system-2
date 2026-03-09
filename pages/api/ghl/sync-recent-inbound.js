// /pages/api/ghl/sync-recent-inbound.js
// GHL integration disabled — returns empty messages
export default async function handler(req, res) {
  return res.status(200).json({ disabled: true, message: 'GHL integration disabled', synced: 0 });
}
