// /pages/api/ghl/appointment-status.js
// GHL integration disabled — webhook handler returns 200 without processing
export default async function handler(req, res) {
  return res.status(200).json({ disabled: true, message: 'GHL integration disabled' });
}
