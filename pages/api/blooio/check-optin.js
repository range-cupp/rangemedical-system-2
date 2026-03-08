// pages/api/blooio/check-optin.js
// GET endpoint — checks if a phone number has Blooio opt-in (has replied before)
// Used by Send Forms UI to show opt-in status indicator
// Range Medical

import { hasBlooioOptIn, isBlooioProvider } from '../../../lib/blooio-optin';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { phone } = req.query;

    if (!phone) {
      return res.status(400).json({ error: 'Phone number required' });
    }

    // If not using Blooio, opt-in is not relevant — always true
    if (!isBlooioProvider()) {
      return res.status(200).json({ optedIn: true, provider: 'twilio' });
    }

    const optedIn = await hasBlooioOptIn(phone);

    return res.status(200).json({ optedIn, provider: 'blooio' });

  } catch (error) {
    console.error('Check opt-in error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
