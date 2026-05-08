// /pages/api/voice-agent/internal-token.js
// Generates a Retell access token for the internal staff voice assistant.

import { requireAuth } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const employee = await requireAuth(req, res);
  if (!employee) return;

  const apiKey = process.env.RETELL_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'RETELL_API_KEY not configured' });
  }

  const agentId = (process.env.RETELL_INTERNAL_AGENT_ID || '').trim();
  if (!agentId) {
    return res.status(500).json({ error: 'RETELL_INTERNAL_AGENT_ID not configured' });
  }

  try {
    const response = await fetch('https://api.retellai.com/v2/create-web-call', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        agent_id: agentId,
        metadata: {
          employee_id: employee.id,
          employee_name: employee.name,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Retell internal create-web-call error:', response.status, errText);
      return res.status(500).json({ error: 'Failed to create voice call' });
    }

    const data = await response.json();
    return res.status(200).json({ access_token: data.access_token });
  } catch (err) {
    console.error('Retell internal token error:', err);
    return res.status(500).json({ error: 'Failed to create voice call' });
  }
}
