// POST /api/oxygen/subscribe
// Handles email opt-in for the 30-day email series
// TODO: Wire up email provider (Resend, ConvertKit, etc.)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { firstName, email } = req.body;

    if (!firstName || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    // Log for now — wire up email provider later
    console.log(`[oxygen] New subscriber: ${firstName} <${email}>`);

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Oxygen subscribe error:', error);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}
