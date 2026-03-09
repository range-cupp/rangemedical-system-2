// /pages/api/ghl/start-protocol.js
// GHL integration disabled — returns 200 without processing
export default async function handler(req, res) {
  return res.status(200).json({ disabled: true, message: 'GHL integration disabled' });
}
